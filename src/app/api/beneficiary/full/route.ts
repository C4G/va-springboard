import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for the incoming request body (matching the frontend structure)
type ImportData = {
  student: {
    aadharNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string
    gender: string;
    visualAcuity: string;
    className: string;
    city: string;
    phoneNumber: string;
    email: string;
    govDisabilityCert: string;
    caseStory: string;
    schoolName: string; // Used to resolve School ID
  };
  device: {
    type: string; // Used to resolve Device ID
    // Add other required device fields here
  };
  beneficiary: {
    issueDate: string; // ISO string
    required: string;
  };
};

/**
 * POST handler for bulk importing a single record (School, Student, Device, Beneficiary).
 * Uses a Prisma transaction to ensure all related operations succeed or fail together.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse and Validate Input
    const body: ImportData = await req.json();
    const {
      student: studentData,
      device: deviceData,
      beneficiary: beneficiaryData,
    } = body;

    if (
      !studentData.aadharNumber ||
      !studentData.schoolName ||
      !deviceData.type
    ) {
      return NextResponse.json(
        {
          error:
            'Missing critical identifiers: Aadhar Number, School Name, or Device Type.',
        },
        { status: 400 }
      );
    }

    // Use a transaction for atomicity: all operations must succeed.
    const result = await prisma.$transaction(async (tx) => {
      // --- 2. School Lookup/Creation (Upsert by Name) ---
      // We assume School.Name is a unique field for robust lookup.
      const school = await tx.school.findFirst({
        where: { Name: studentData.schoolName },
        select: { id: true },
      });
      if (!school) {
        throw new Error(
          `School not found with name: ${studentData.schoolName}`
        );
      }
      const schoolId = school.id;

      // --- 3. Device Lookup ---
      const device = await tx.device.findFirst({
        where: { type: deviceData.type },
        select: { id: true },
      });
      if (!device) {
        throw new Error(`Device not found with type: ${deviceData.type}`);
      }
      const deviceId = device.id;

      // --- 4. FIND POTENTIAL EXISTING STUDENT IDs (MODIFIED) ---
      // Since Aadhar/Name/DOB are not unique, we fetch ALL IDs that match the imported name and gender.
      // This is the pool of students to check against.
      const potentialStudents = await tx.student.findMany({
        where: {
          firstName: studentData.firstName,
          gender: studentData.gender,
        },
        select: { id: true },
      });

      const potentialStudentIds = potentialStudents.map((s) => s.id);

      // --- 5. CHECK FOR EXISTING UNIQUE BENEFICIARY COMBINATION (NEW LOGIC) ---

      // If we found potential existing students, check if any of them are already
      // beneficiaries at this specific school with this specific device.
      if (potentialStudentIds.length > 0) {
        const existingBeneficiary = await tx.beneficiary.findFirst({
          where: {
            // Check if studentId is ANY of the potential duplicates
            studentId: { in: potentialStudentIds },
            schoolId: schoolId,
            deviceId: deviceId,
          },
        });

        if (existingBeneficiary) {
          // If a matching record is found, throw an error to fail the transaction
          throw new Error(
            `Duplicate record: A beneficiary already exists for a student with this Name/Gender combination at School (${studentData.schoolName}) using Device Type (${deviceData.type}).`
          );
        }
      }

      // After the check, we still need to decide which studentId to use for the new beneficiary record.
      let finalStudentId: string;

      if (potentialStudentIds.length > 0) {
        // OPTION A: If duplicates were found, use the ID of the first one found.
        // This implies the import system treats all matching Name/Gender combinations as the same person.
        finalStudentId = potentialStudentIds[0];
      } else {
        // OPTION B: No matching student found. Create a new one.
        const dobDate = new Date(studentData.dateOfBirth);
        const newStudent = await tx.student.create({
          data: {
            aadharNumber: studentData.aadharNumber,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            dateOfBirth: dobDate,
            gender: studentData.gender,
            visualAcuity: studentData.visualAcuity,
            className: studentData.className,
            city: studentData.city,
            phoneNumber: studentData.phoneNumber,
            email: studentData.email,
            govDisabilityCert: studentData.govDisabilityCert,
            caseStory: studentData.caseStory,
            schoolId: schoolId,
          },
          select: { id: true },
        });
        finalStudentId = newStudent.id;
      }

      // --- 7. Beneficiary Creation ---
      return tx.beneficiary.create({
        data: {
          studentId: finalStudentId, // Use the resolved or newly created ID
          schoolId: schoolId,
          deviceId: deviceId,
          issueDate: new Date(beneficiaryData.issueDate),
          required: beneficiaryData.required,
        },
      });

      // return newBeneficiary;
    });

    console.log('Beneficiary record imported successfully:', result.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error during relational import transaction:', error);

    // Differentiate between known Prisma errors (e.g., failed validation) and others
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific database errors if needed, e.g., unique constraint failure
      return NextResponse.json(
        { error: `Database error during import: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during import process.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
