/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CaseStoryInput } from './caseStory';
import { BeneficiariesReportTable } from './deviceAssignTable';
import { GrantReportTable } from './grantTable';
import { SummaryTable } from './totalsTable';
import { TrainingEnrollmentsReportTable } from './trainingEnrollTable';
import { QuarterlyImport } from './quarterly-import';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { isKnownRole } from '@/utils/role';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
export default function CombinedReport() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const darkMode = useIsDarkTheme();

  useEffect(() => {
    if (status === 'unauthenticated' || !isKnownRole(session?.user?.role)) {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return <div className='p-6'>Loading...</div>;
  if (status === 'unauthenticated' || !isKnownRole(session?.user?.role)) {
    return null;
  }

  const [grants, setGrants] = React.useState<any[]>([]);
  const [schools, setSchools] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [enrollments, setEnrollments] = React.useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = React.useState<any[]>([]);
  const [devices, setDevices] = React.useState<any[]>([]);
  const [programs, setPrograms] = React.useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = React.useState('');
  const [selectedQuarter, setSelectedQuarter] = React.useState('Q1');

  const quarterRanges = React.useMemo(() => {
    const year = new Date().getFullYear();
    return {
      Q1: { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) },
      Q2: { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) },
      Q3: { start: new Date(`${year}-07-01`), end: new Date(`${year}-09-30`) },
      Q4: { start: new Date(`${year}-10-01`), end: new Date(`${year}-12-31`) },
    };
  }, []);

  const [useCustomDates, setUseCustomDates] = React.useState(false);
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const [showQuarterlyImport, setShowQuarterlyImport] = React.useState(false);

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
    const { start, end } = dateRange;

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
        .filter((e) => {
          const d = new Date(e.endDate);
          return d >= start && d <= end;
        })
        .filter((e) => !selectedSchool || student.schoolId === selectedSchool)
        .map((e) => {
          const school = schools.find((s) => s.id === student.schoolId);
          const program = programs.find((p) => p.id === e.trainingprogramId);
          const today = new Date();
          const dob = new Date(student.dateOfBirth);
          return {
            Student: `${student.firstName}`,
            Age: today.getFullYear() - dob.getFullYear(),
            AadharNo: student.aadharNumber,
            Gender: student.gender,
            VisualAcuity: student.visualAcuity,
            School: school?.Name ?? '',
            Class: student.className,
            Location: school?.Location ?? '',
            Program: program?.name ?? '',
            StartDate: e.startDate,
            EndDate: e.endDate,
            Sessions: e.sessions,
            ExpectedOutcome: program?.outcome ?? '',
          };
        })
    );

    const deviceSheet = students.flatMap((student) =>
      beneficiaries
        .filter((b) => b.studentId === student.id)
        .filter((b) => !selectedSchool || student.schoolId === selectedSchool)
        .filter((b) => {
          const d = new Date(b.issueDate);
          return d >= start && d <= end;
        })
        .map((b) => {
          const school = schools.find((s) => s.id === student.schoolId);
          const device = devices.find((d) => d.id === b.deviceId);
          const today = new Date();
          const dob = new Date(student.dateOfBirth);
          return {
            Student: `${student.firstName}`,
            Age: today.getFullYear() - dob.getFullYear(),
            AadharNo: student.aadharNumber,
            Gender: student.gender,
            VisualAcuity: student.visualAcuity,
            School: school?.Name ?? '',
            Class: student.className,
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
      'Training Program Enrollments'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(deviceSheet),
      'Device Assignments'
    );

    const programSummary = programs.map((program) => {
      const count = enrollments.filter(
        (e) => e.trainingprogramId === program.id
      ).length;
      return {
        'Program Name': program.name,
        'Enrolled Students': count,
      };
    });

    const deviceSummary = devices.map((device) => {
      const count = beneficiaries.filter(
        (b) => b.deviceId === device.id
      ).length;
      return {
        'Device Type': device.type,
        Description: device.desc,
        'Assigned Students': count,
      };
    });

    const programWS = XLSX.utils.json_to_sheet(programSummary);
    const deviceWS = XLSX.utils.json_to_sheet(deviceSummary);
    XLSX.utils.book_append_sheet(wb, programWS, 'Training Program Totals');
    XLSX.utils.book_append_sheet(wb, deviceWS, 'Device Assignment Totals');
    if (caseStories.length > 0) {
      const caseStoryWS = XLSX.utils.json_to_sheet(caseStories);
      XLSX.utils.book_append_sheet(wb, caseStoryWS, 'Case and Success Stories');
    }
    XLSX.writeFile(wb, 'VA_Report.xlsx');
  };
  const dateRange = React.useMemo(() => {
    if (useCustomDates && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
      };
    }
    return quarterRanges[selectedQuarter];
  }, [
    useCustomDates,
    customStartDate,
    customEndDate,
    selectedQuarter,
    quarterRanges,
  ]);

  const { start, end } = dateRange;

  const filteredGrants = grants
    .filter((g) => {
      const d = new Date(g.mouDate);
      return d >= start && d <= end;
    })
    .filter((g) => !selectedSchool || g.schoolId === selectedSchool)
    .map((g) => {
      const s = schools.find((x) => x.id === g.schoolId);
      return {
        ...g,
        schoolName: s?.Name ?? 'Unknown',
      };
    });

  const filteredBeneficiaries = students.flatMap((student) =>
    beneficiaries
      .filter((b) => b.studentId === student.id)
      .filter((b) => !selectedSchool || student.schoolId === selectedSchool)
      .filter((b) => {
        const d = new Date(b.issueDate);
        return d >= start && d <= end;
      })
      .map((b) => {
        const school = schools.find((s) => s.id === student.schoolId);
        const device = devices.find((d) => d.id === b.deviceId);
        const today = new Date();
        const dob = new Date(student.dateOfBirth);
        const age = today.getFullYear() - dob.getFullYear();
        return {
          studentName: `${student.firstName}`,
          aadharNumber: student.aadharNumber,
          gender: student.gender,
          age,
          visualAcuity: student.visualAcuity,
          school: school?.Name ?? '',
          device: device?.type ?? '',
          issueDate: b.issueDate,
          required: b.required,
        };
      })
  );

  const trainingSummary = programs.map((program) => {
    const count = enrollments.filter(
      (e) => e.trainingprogramId === program.id
    ).length;
    return {
      'Program Name': program.name,
      'Enrolled Students': count,
      'Expected Outcome/Observations': program.outcome,
    };
  });
  const enrollmentSheet = students.flatMap((student) =>
    enrollments
      .filter((e) => e.studentId === student.id)
      .filter((b) => {
        const d = new Date(b.endDate);
        return d >= start && d <= end;
      })
      .filter((e) => !selectedSchool || student.schoolId === selectedSchool)
      .map((e) => {
        const school = schools.find((s) => s.id === student.schoolId);
        const program = programs.find((p) => p.id === e.trainingprogramId);
        const today = new Date();
        const dob = new Date(student.dateOfBirth);
        return {
          Student: `${student.firstName}`,
          Age: today.getFullYear() - dob.getFullYear(),
          AadharNo: student.aadharNumber,
          Gender: student.gender,
          VisualAcuity: student.visualAcuity,
          School: school?.Name ?? '',
          Class: student.className,
          Location: school?.Location ?? '',
          Program: program?.name ?? '',
          StartDate: e.startDate,
          EndDate: e.endDate,
          Sessions: e.sessions,
          ExpectedOutcome: program?.outcome ?? '',
        };
      })
  );
  const deviceSummary = devices.map((device) => {
    const count = beneficiaries.filter((b) => b.deviceId === device.id).length;
    return {
      'Device Type': device.type,
      Description: device.desc,
      'Assigned Students': count,
    };
  });

  const caseStories = React.useMemo(() => {
    return students
      .filter((s) => !selectedSchool || s.schoolId === selectedSchool)
      .filter((s) => s.caseStory?.trim())
      .map((s) => ({
        studentName: `${s.firstName}`,
        story: s.caseStory,
      }));
  }, [students, selectedSchool]);

  // CHARTS CODE
  const textColor = darkMode ? 'white' : 'black';
  const lineColor = darkMode ? 'grey' : 'lightgrey';
  const accentColor = '#326C24';

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { font: { size: 12 }, color: textColor },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 12 }, color: textColor, stepSize: 1 },
        grid: { color: lineColor },
      },
    },
  };

  const createChartData = (dataObj: Record<string, number>, label: string) => ({
    labels: Object.keys(dataObj),
    datasets: [
      {
        label,
        data: Object.values(dataObj),
        backgroundColor: accentColor,
      },
    ],
  });

  const chartBeneficiaries = students.flatMap((student) =>
    beneficiaries
      .filter((b) => b.studentId === student.id)
      .filter((b) => !selectedSchool || student.schoolId === selectedSchool)
      .map((b) => {
        const school = schools.find((s) => s.id === student.schoolId);
        return {
          school: school?.Name ?? 'Unknown',
        };
      })
  );

  const devicesBySchool = chartBeneficiaries.reduce(
    (acc: Record<string, number>, row: any) => {
      const school = row.school || 'None';
      acc[school] = (acc[school] || 0) + 1;
      return acc;
    },
    {}
  );

  const topDevicesBySchool = Object.fromEntries(
    Object.entries(devicesBySchool)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );

  const activeTrainingRows = students.flatMap((student) =>
    enrollments
      .filter((e) => e.studentId === student.id)
      .filter((e) => !selectedSchool || student.schoolId === selectedSchool)
      .filter((e) => !e.endDate || new Date(e.endDate) > new Date())
      .map((e) => {
        const programName =
          e.trainingProgram?.name ||
          programs.find((p) => p.id === e.trainingprogramId)?.name ||
          'None';
        return { Program: programName };
      })
  );

  const activeTrainingsByProgram = activeTrainingRows.reduce(
    (acc: Record<string, number>, row: any) => {
      const programName = row.Program || 'None';
      acc[programName] = (acc[programName] || 0) + 1;
      return acc;
    },
    {}
  );

  const deviceChart = createChartData(topDevicesBySchool, 'Devices');
  const trainingChart = createChartData(activeTrainingsByProgram, 'Trainings');

  function ChartTile({
    title,
    data,
  }: {
    title: string;
    data: ChartData<'bar'>;
  }) {
    return (
      <div className='h-80' style={{ color: textColor }}>
        <h2 className='text-center text-lg'>{title}</h2>
        <Bar data={data} options={barChartOptions} />
      </div>
    );
  }
  // END CHARTS CODE

  return (
    <div className='space-y-6 p-6'>
      <h2 className='text-xl font-bold'>Unified Report Export</h2>
      <div className='flex items-center gap-6'>
        <Button onClick={exportCombined}>Export All to Excel</Button>
        <Button onClick={() => setShowQuarterlyImport(true)} variant='outline'>
          Quarterly Import
        </Button>
      </div>

      {showQuarterlyImport && (
        <QuarterlyImport onClose={() => setShowQuarterlyImport(false)} />
      )}

      <div className='mb-4 flex flex-col items-start gap-4 md:flex-row'>
        {/* Quarter and school filters */}
        <div className='flex gap-4'>
          {/* Quarter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                {selectedQuarter} <ChevronDown className='ml-2' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={selectedQuarter}
                onValueChange={(q) => {
                  setSelectedQuarter(q);
                  const { start, end } = quarterRanges[q];
                  setCustomStartDate(start.toISOString().split('T')[0]);
                  setCustomEndDate(end.toISOString().split('T')[0]);
                }}
              >
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                  <DropdownMenuRadioItem key={q} value={q}>
                    {q}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* School filter */}
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
            <DropdownMenuContent
              align='center'
              className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
            >
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
        </div>

        {/* Date filter block */}
        <div className='flex flex-col gap-2'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={useCustomDates}
              onChange={(e) => setUseCustomDates(e.target.checked)}
            />
            Use custom date range
          </label>

          {useCustomDates && (
            <div className='flex gap-2'>
              <input
                type='date'
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className='rounded border px-2 py-1'
              />
              <span>to</span>
              <input
                type='date'
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className='rounded border px-2 py-1'
              />
            </div>
          )}
        </div>
      </div>

      {/* TABS PREVIEW BELOW */}
      <Tabs defaultValue='grants' className='w-full'>
        {/* TabsList + TabsContent... */}
      </Tabs>

      {/* preview report*/}
      <Tabs defaultValue='grants' className='w-full'>
        <TabsList>
          <TabsTrigger value='charts'>Charts</TabsTrigger>
          <TabsTrigger value='grants'>Grant Report</TabsTrigger>
          <TabsTrigger value='beneficiaries'>Device Assignments</TabsTrigger>
          <TabsTrigger value='enrollments'>
            Student Training Enrollments
          </TabsTrigger>
          <TabsTrigger value='summaries'>Device and Program Totals</TabsTrigger>
          <TabsTrigger value='caseStories'>Case Stories</TabsTrigger>
        </TabsList>

        <TabsContent value='charts'>
          <div>
            <i>Charts do not filter by quarter</i>
          </div>
          <div className='grid grid-cols-1 gap-4 py-4 lg:grid-cols-2'>
            <ChartTile
              title='Count of Devices by School (Top 10)'
              data={deviceChart}
            />
            <ChartTile
              title='Active Trainings by Program'
              data={trainingChart}
            />
          </div>
        </TabsContent>

        <TabsContent value='grants'>
          <GrantReportTable data={filteredGrants} />
        </TabsContent>

        <TabsContent value='beneficiaries'>
          <BeneficiariesReportTable data={filteredBeneficiaries} />
        </TabsContent>

        <TabsContent value='enrollments'>
          <TrainingEnrollmentsReportTable data={enrollmentSheet} />
        </TabsContent>

        <TabsContent value='summaries'>
          <SummaryTable
            trainingSummary={trainingSummary}
            deviceSummary={deviceSummary}
          />
        </TabsContent>

        <TabsContent value='caseStories'>
          <div className='space-y-4'>
            {caseStories.length === 0 ? (
              <p className='text-gray-500'>No case stories available.</p>
            ) : (
              caseStories.map((story, index) => (
                <div key={index} className='rounded-md border p-4 shadow-sm'>
                  <p className='font-semibold'>{story.studentName}</p>
                  <p className='mt-2 whitespace-pre-line text-gray-700'>
                    {story.story}
                  </p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
