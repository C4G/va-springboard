/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CombinedReport() {
  const [grants, setGrants] = React.useState<any[]>([]);
  const [schools, setSchools] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [enrollments, setEnrollments] = React.useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = React.useState<any[]>([]);
  const [devices, setDevices] = React.useState<any[]>([]);
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = React.useState('');
  const [selectedQuarter, setSelectedQuarter] = React.useState('Q1');
  const { data: session, status } = useSession();

  const quarterRanges = React.useMemo(() => {
    const year = new Date().getFullYear();
    return {
      Q1: { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) },
      Q2: { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) },
      Q3: { start: new Date(`${year}-07-01`), end: new Date(`${year}-09-30`) },
      Q4: { start: new Date(`${year}-10-01`), end: new Date(`${year}-12-31`) },
    };
  }, []);

  React.useEffect(() => {
    async function fetchAll() {
      try {
        const [
          grantsRes,
          schoolsRes,
          studentsRes,
          enrollmentsRes,
          beneficiariesRes,
          devicesRes,
          programsRes,
        ] = await Promise.all([
          fetch('/api/grants'),
          fetch('/api/schools'),
          fetch('/api/students'),
          fetch('/api/studentTraining'),
          fetch('/api/beneficiary'),
          fetch('/api/devices'),
          fetch('/api/training-program'),
        ]);

        setGrants(await grantsRes.json());
        const schoolData = await schoolsRes.json();
        setSchools(schoolData);

        const userSchoolId = session?.user?.schoolId;
        const filteredStudents = (await studentsRes.json()).filter((s: any) =>
          session?.user?.role === 'STAFF' ? s.schoolId === userSchoolId : true
        );
        setStudents(filteredStudents);

        setEnrollments(await enrollmentsRes.json());
        setBeneficiaries(await beneficiariesRes.json());
        setDevices(await devicesRes.json());
        setPrograms(await programsRes.json());

        if (session?.user?.role === 'STAFF' && userSchoolId) {
          setSelectedSchool(userSchoolId);
        }
      } catch (err) {
        console.error('Error fetching:', err);
      }
    }

    if (status === 'authenticated') fetchAll();
  }, [session, status]);

  const exportCombined = () => {
    const { start, end } = quarterRanges[selectedQuarter];

    const filteredGrants = grants
      .filter((g) => {
        const d = new Date(g.mouDate);
        return d >= start && d <= end;
      })
      .filter((g) => !selectedSchool || g.schoolId === selectedSchool)
      .map((g) => {
        const s = schools.find((x) => x.id === g.schoolId);
        return {
          SchoolName: s?.Name ?? 'Unknown',
          MOUDate: g.mouDate,
          SchoolCity: s?.Location ?? 'Unknown',
          Tier: s?.Tier ?? 'Unknown',
          Email: s?.Email ?? '',
          Phone: s?.Phone ?? '',
          Notes: s?.Notes ?? '',
          GrantTotal: g.grantTotal,
          InfraGrant: g.grantInf,
          TrainingGrant: g.grantTrain,
          InfraSpent: g.grantInfSp,
          TrainSpent: g.grantTrainSp,
        };
      });

    const enrollmentSheet = students.flatMap((student) =>
      enrollments
        .filter((e) => e.studentId === student.id)
        .map((e) => {
          const school = schools.find((s) => s.id === student.schoolId);
          const program = programs.find((p) => p.id === e.trainingprogramId);
          return {
            Student: `${student.firstName}`,
            Aadhar: student.aadharNumber,
            VisualAcuity: student.visualAcuity,
            School: school?.Name ?? '',
            Location: school?.Location ?? '',
            Program: program?.name ?? '',
            StartDate: e.startDate,
            EndDate: e.endDate,
            Sessions: e.sessions,
          };
        })
    );

    const deviceSheet = students.flatMap((student) =>
      beneficiaries
        .filter((b) => b.studentId === student.id)
        .map((b) => {
          const school = schools.find((s) => s.id === student.schoolId);
          const device = devices.find((d) => d.id === b.deviceId);
          return {
            Student: `${student.firstName}`,
            Aadhar: student.aadharNumber,
            VisualAcuity: student.visualAcuity,
            School: school?.Name ?? '',
            Device: device?.desc ?? '',
            Type: device?.type ?? '',
            Param1: device?.techParam1 ?? '',
            Param2: device?.techParam2 ?? '',
            Required: b.required,
            IssueDate: b.issueDate,
          };
        })
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filteredGrants),
      'Grants'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(enrollmentSheet),
      'Enrollments'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(deviceSheet),
      'Devices'
    );

    XLSX.writeFile(wb, 'VA_Report.xlsx');
  };

  return (
    <div className='space-y-6 p-6'>
      <h2 className='text-xl font-bold'>Unified Report Export</h2>
      <div className='flex items-center gap-6'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              {selectedQuarter} <ChevronDown className='ml-2' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={selectedQuarter}
              onValueChange={setSelectedQuarter}
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <DropdownMenuRadioItem key={q} value={q}>
                  {q}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              disabled={session?.user?.role === 'STAFF'}
            >
              {selectedSchool
                ? schools.find((s) => s.id === selectedSchool)?.Name
                : 'All Schools'}
              <ChevronDown className='ml-2' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={selectedSchool}
              onValueChange={setSelectedSchool}
            >
              {session?.user?.role !== 'STAFF' && (
                <DropdownMenuRadioItem value=''>All</DropdownMenuRadioItem>
              )}
              {schools
                .filter((s) =>
                  session?.user?.role === 'STAFF'
                    ? s.id === session.user.schoolId
                    : true
                )
                .map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id}>
                    {s.Name}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={exportCombined}>Export All to Excel</Button>
      </div>
    </div>
  );
}
