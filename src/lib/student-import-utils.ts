import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { normalizeClassName } from '@/lib/class-normalizer';

export type StudentData = {
  firstName: string;
  aadharNumber?: string;
  age?: number;
  gender?: string;
  visualAcuity?: string;
  className?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  govDisabilityCert?: string;
};

export type FindOrCreateStudentResult =
  | { success: true; studentId: string; wasCreated: boolean; error?: never }
  | { success: false; error: string; studentId?: never; wasCreated?: never };

export type ValidateStudentResult =
  | { success: true; studentId?: string; wouldCreate: boolean; error?: never }
  | { success: false; error: string; studentId?: never; wouldCreate?: never };

/**
 * Finds or creates a student based on Aadhar number or name.
 *
 * Logic:
 * - If Aadhar is provided:
 *   - Look up by Aadhar + School
 *   - If multiple found: Return error
 *   - If one found: Return existing student
 *   - If none found: Create new student with provided data
 * - If no Aadhar:
 *   - Look up by firstName + School
 *   - If none found: Return error (cannot create without Aadhar)
 *   - If multiple found: Return error (ambiguous)
 *   - If one found: Return existing student
 */
export async function findOrCreateStudent(
  schoolId: string,
  studentData: StudentData,
  tx?: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >
): Promise<FindOrCreateStudentResult> {
  const db = tx || prisma;
  const { firstName, aadharNumber, age, ...otherFields } = studentData;

  // Case 1: Aadhar number provided
  if (aadharNumber?.trim()) {
    const normalizedAadhar = aadharNumber.trim().replace(/\s/g, '');

    const matchedStudents = await db.student.findMany({
      where: {
        aadharNumber: normalizedAadhar,
        schoolId,
      },
      select: { id: true },
      take: 2,
    });

    // Multiple students with same Aadhar
    if (matchedStudents.length > 1) {
      return {
        success: false,
        error: `Multiple students found for Aadhar Number ${normalizedAadhar}`,
      };
    }

    // Student exists - return it
    if (matchedStudents.length === 1) {
      return {
        success: true,
        studentId: matchedStudents[0].id,
        wasCreated: false,
      };
    }

    // Student doesn't exist - create it
    const dateOfBirth = age
      ? new Date(
          new Date().getFullYear() - age,
          new Date().getMonth(),
          new Date().getDate()
        )
      : new Date();

    // Normalize the class name once for both fields
    const normalizedClass = normalizeClassName(otherFields.className);

    const createdStudent = await db.student.create({
      data: {
        aadharNumber: normalizedAadhar,
        firstName: firstName.trim(),
        lastName: '',
        dateOfBirth,
        gender: (otherFields.gender || 'U').trim(),
        visualAcuity: otherFields.visualAcuity || 'N/A',
        className: normalizedClass,
        studentClass: normalizedClass,
        city: otherFields.city || 'N/A',
        phoneNumber: otherFields.phoneNumber || '',
        email: otherFields.email || '',
        govDisabilityCert: otherFields.govDisabilityCert || '',
        caseStory: '',
        schoolId,
      },
      select: { id: true },
    });

    return {
      success: true,
      studentId: createdStudent.id,
      wasCreated: true,
    };
  }

  // Case 2: No Aadhar - lookup by name only
  const students = await db.student.findMany({
    where: {
      firstName: firstName.trim(),
      schoolId,
    },
    select: { id: true },
    take: 2,
  });

  if (students.length === 0) {
    return {
      success: false,
      error: `Student not found: ${firstName}. Aadhar Number required to create new student.`,
    };
  }

  if (students.length > 1) {
    return {
      success: false,
      error: `Multiple students with same name: ${firstName}`,
    };
  }

  return {
    success: true,
    studentId: students[0].id,
    wasCreated: false,
  };
}

/**
 * Validates whether a student can be found or created (dry-run mode).
 * Does NOT create any students, only validates the operation would succeed.
 *
 * Returns studentId if found, or indicates it would be created.
 */
export async function validateStudent(
  schoolId: string,
  studentData: StudentData,
  tx?: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >
): Promise<ValidateStudentResult> {
  const db = tx || prisma;
  const { firstName, aadharNumber } = studentData;

  // Case 1: Aadhar number provided
  if (aadharNumber?.trim()) {
    const normalizedAadhar = aadharNumber.trim().replace(/\s/g, '');

    const matchedStudents = await db.student.findMany({
      where: {
        aadharNumber: normalizedAadhar,
        schoolId,
      },
      select: { id: true },
      take: 2,
    });

    // Multiple students with same Aadhar
    if (matchedStudents.length > 1) {
      return {
        success: false,
        error: `Multiple students found for Aadhar Number ${normalizedAadhar}`,
      };
    }

    // Student exists
    if (matchedStudents.length === 1) {
      return {
        success: true,
        studentId: matchedStudents[0].id,
        wouldCreate: false,
      };
    }

    // Student doesn't exist - would be created
    return {
      success: true,
      wouldCreate: true,
    };
  }

  // Case 2: No Aadhar - lookup by name only
  const students = await db.student.findMany({
    where: {
      firstName: firstName.trim(),
      schoolId,
    },
    select: { id: true },
    take: 2,
  });

  if (students.length === 0) {
    return {
      success: false,
      error: `Student not found: ${firstName}. Aadhar Number required to create new student.`,
    };
  }

  if (students.length > 1) {
    return {
      success: false,
      error: `Multiple students with same name: ${firstName}`,
    };
  }

  return {
    success: true,
    studentId: students[0].id,
    wouldCreate: false,
  };
}
