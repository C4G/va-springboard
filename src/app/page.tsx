'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme';
import { isKnownRole } from '@/utils/role';

export default function Home() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [grants, setGrants] = useState([]);
  const darkMode = useIsDarkTheme();

  // Select count colors
  const textColor = darkMode ? 'white' : 'black';
  const lineColor = darkMode ? 'grey' : 'lightgrey';
  const accentColor = '#326C24'; // Selected from Vision Aid logo

  const { data: session, status } = useSession();

  useEffect(() => {
    if (performance.navigation.type === 2) {
      window.location.reload();
    }
  }, []);

  // Get beneficiary data
  useEffect(() => {
    if (status !== 'authenticated' || !isKnownRole(session?.user?.role)) return;
    Promise.all([
      fetch('/api/beneficiary').then((res) => res.json()),
      fetch('/api/schools').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
      fetch('/api/studentTraining').then((res) => res.json()),
      fetch('/api/grants').then((res) => res.json()),
    ])
      .then(
        ([beneficiary, schoolData, studentData, enrollmentData, grantData]) => {
          setBeneficiaries(beneficiary);
          setSchools(schoolData);
          setStudents(studentData);
          setEnrollments(enrollmentData);
          setGrants(grantData);
        }
      )
      .catch((err) => {
        console.error('Unable to fetch chart data. Error: ', err);
      });
  }, [status, session]);

  // Filter trainings data
  const activeEnrollmentRows = enrollments.filter(
    (enrollment: { endDate?: string }) => {
      if (!enrollment.endDate) return true;
      return new Date(enrollment.endDate) > new Date();
    }
  );

  // Aggregate data and create count tiles
  const totalActiveTrainings = activeEnrollmentRows.length;
  const totalUniqueStudents = students.length;
  const totalStudentDevices = beneficiaries.length;
  const totalGrants = grants.length;
  const totalSchools = schools.length;

  const countTiles = [
    { label: 'Schools', value: totalSchools },
    { label: 'Unique Students', value: totalUniqueStudents },
    { label: 'Student Devices', value: totalStudentDevices },
    { label: 'Active Trainings', value: totalActiveTrainings },
    { label: 'Grants', value: totalGrants },
  ];

  function CountTile({ label, value }: { label: string; value: number }) {
    return (
      <div
        className='flex h-36 w-36 flex-col items-center justify-center text-center'
        style={{
          borderColor: lineColor,
          borderStyle: 'solid',
          borderWidth: 1,
          borderRadius: '0.25rem',
        }}
      >
        <p>{label}</p>
        <p className='text-3xl font-bold' style={{ color: accentColor }}>
          {value}
        </p>
      </div>
    );
  }

  return (
    <div>
      <br></br>
      {status === 'authenticated' && isKnownRole(session?.user?.role) && (
        <div className='p-4'>
          <div
            className='flex flex-wrap justify-center p-4'
            style={{ color: textColor, gap: '0.75rem' }}
          >
            {countTiles.map((card) => (
              <CountTile
                key={card.label}
                label={card.label}
                value={card.value}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
