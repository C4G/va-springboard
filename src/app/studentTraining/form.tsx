/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const CLASS_OPTIONS = [
  'FIRST',
  'SECOND',
  'THIRD',
  'FOURTH',
  'FIFTH',
  'SIXTH',
  'SEVENTH',
  'EIGHTH',
  'NINTH',
  'TENTH',
  'ELEVENTH',
  'TWELFTH',
  'OTHER',
] as const;

type Student = {
  id: string;
  firstName: string;
  schoolId: string;
  className: string;
};

type TrainingProgram = {
  id: string;
  name: string;
  schoolId: string;
};

type School = {
  id: string;
  Name: string;
};

export default function EnrollmentForm({ id }: { id?: string }) {
  const { register, handleSubmit, setValue, reset } = useForm();

  const [students, setStudents] = useState<Student[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>(
    []
  );
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTrainingProgram, setSelectedTrainingProgram] =
    useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const { data: session, status } = useSession();
  useEffect(() => {
    async function fetchData() {
      if (status !== 'authenticated') return;
      try {
        const [studentsRes, trainingProgramsRes, schoolsRes] =
          await Promise.all([
            fetch('/api/students'),
            fetch('/api/training-program'),
            fetch('/api/schools'),
          ]);

        const filteredData =
          session?.user?.role === 'STAFF' && session.user.schoolId
            ? (await studentsRes.json()).filter(
                (student) => student.schoolId === session.user.schoolId
              )
            : await studentsRes.json();
        const filteredData2 =
          session?.user?.role === 'STAFF' && session.user.schoolId
            ? (await trainingProgramsRes.json()).filter(
                (p) => !p.schoolId || p.schoolId === session.user.schoolId
              )
            : await trainingProgramsRes.json();
        const filteredSchools =
          session?.user?.role === 'STAFF' && session.user.schoolId
            ? (await schoolsRes.json()).filter(
                (p) => !p.id || p.id === session.user.schoolId
              )
            : await schoolsRes.json();

        if (schoolsRes.ok) setSchools(filteredSchools);
        if (studentsRes.ok) setStudents(filteredData);
        if (trainingProgramsRes.ok) setTrainingPrograms(filteredData2);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    }
    fetchData();
  }, [session, status]);

  useEffect(() => {
    if (!id) return;

    async function fetchEnrollment() {
      try {
        const response = await fetch(`/api/studentTraining/${id}`);
        if (!response.ok) throw new Error('Failed to fetch enrollment');

        const data = await response.json();

        reset({
          ...data,
          startDate: data.startDate.split('T')[0],
          endDate: data.endDate.split('T')[0],
        });

        setSelectedStudent(data.studentId);
        setSelectedTrainingProgram(data.trainingprogramId);
        setSelectedSchool(data.schoolId);
      } catch (error) {
        console.error('Error fetching enrollment:', error);
      }
    }
    fetchEnrollment();
  }, [id, reset]);

  async function onSubmit(data: any) {
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/api/studentTraining/${id}` : '/api/studentTraining';

    if (!id && selectedStudents.length === 0) {
      toast.error('Please select at least one student.');
      return;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: id ? selectedStudent : undefined,
        studentIds: !id ? selectedStudents : undefined,
        schoolId: selectedSchool,
        trainingprogramId: selectedTrainingProgram,
        startDate: data.startDate,
        endDate: data.endDate,
        sessions: parseInt(data.sessions),
        notes: data.notes,
        studentClass: studentClass,
      }),
    });

    if (response.ok) {
      toast.success(
        id
          ? 'Enrollment Updated Successfully'
          : 'Training Enrollment added Successfully'
      );
      reset();
      setSelectedStudent('');
      setSelectedStudents([]);
    }
  }

  const normalizedClass = studentClass.trim().toLowerCase();
  const filteredStudents = students
    .filter((student) => student.schoolId === selectedSchool)
    .filter((student) =>
      normalizedClass
        ? student.className.toLowerCase().includes(normalizedClass)
        : true
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium'>School</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              {schools.find((s) => s.id === selectedSchool)?.Name ||
                'Select a School'}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='center'
            className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            {schools.map((school) => (
              <DropdownMenuItem
                key={school.id}
                onClick={() => {
                  setSelectedSchool(school.id);
                  setSelectedStudent('');
                  setSelectedStudents([]);
                  setValue('schoolId', school.id);
                }}
              >
                {school.Name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <label className='block text-sm font-medium'>Class</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              {studentClass || 'Select a Class'}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='center'
            className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            <DropdownMenuRadioGroup
              value={studentClass}
              onValueChange={(value) => {
                setStudentClass(value);
                setSelectedStudent('');
                setSelectedStudents([]);
              }}
            >
              {CLASS_OPTIONS.map((classOption) => (
                <DropdownMenuRadioItem key={classOption} value={classOption}>
                  {classOption}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {}
      <div>
        <label className='block text-sm font-medium'>Student</label>
        {id ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                {students.find((s) => s.id === selectedStudent)?.firstName ||
                  'Select a Student'}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='center'
              className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
            >
              {filteredStudents.map((student) => (
                <DropdownMenuItem
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student.id);
                    setSelectedSchool(student.schoolId);
                    setValue('studentId', student.id);
                    setValue('schoolId', student.schoolId);
                  }}
                >
                  {student.firstName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                {selectedStudents.length > 0
                  ? `${selectedStudents.length} selected`
                  : 'Select Students'}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='center'
              className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() =>
                  setSelectedStudents(filteredStudents.map((s) => s.id))
                }
              >
                Select all
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => setSelectedStudents([])}
              >
                Clear selection
              </DropdownMenuItem>
              {filteredStudents.length === 0 && (
                <DropdownMenuItem disabled>
                  No students match this filter
                </DropdownMenuItem>
              )}
              {filteredStudents.map((student) => (
                <DropdownMenuCheckboxItem
                  key={student.id}
                  onSelect={(e) => e.preventDefault()}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={(checked) => {
                    setSelectedStudents((prev) =>
                      checked
                        ? [...prev, student.id]
                        : prev.filter((id) => id !== student.id)
                    );
                    setSelectedSchool(student.schoolId);
                    setValue('schoolId', student.schoolId);
                  }}
                >
                  {student.firstName}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {}
      <div className='hidden'>
        <label className='block text-sm font-medium'>
          School Id (Auto-filled on student selection)
        </label>
        <Input value={selectedSchool} disabled className='cursor-not-allowed' />
      </div>

      {}
      <div>
        <label className='block text-sm font-medium'>Training Program</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              {trainingPrograms.find((p) => p.id === selectedTrainingProgram)
                ?.name || 'Select a Training Program'}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='center'
            className='max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            {trainingPrograms.map((program) => (
              <DropdownMenuItem
                key={program.id}
                onClick={() => {
                  setSelectedTrainingProgram(program.id);
                  setValue('trainingprogramId', program.id);
                }}
              >
                {program.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <label className='block text-sm font-medium'>Start Date</label>
        <Input
          {...register('startDate')}
          type='date'
          required
          defaultValue={id ? undefined : new Date().toISOString().split('T')[0]}
        />
      </div>

      <div>
        <label className='block text-sm font-medium'>End Date</label>
        <Input
          {...register('endDate')}
          type='date'
          required
          defaultValue={id ? undefined : new Date().toISOString().split('T')[0]}
        />
      </div>

      {}
      <div>
        <label className='block text-sm font-medium'>Sessions</label>
        <Input
          type='number'
          min={0}
          step={1}
          {...register('sessions', {
            valueAsNumber: true,
            min: { value: 0, message: 'Must be 0 or greater' },
          })}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e') {
              e.preventDefault();
            }
          }}
        />
      </div>

      {}
      <div>
        <label className='block text-sm font-medium'>Notes</label>
        <Input {...register('notes')} placeholder='Notes' />
      </div>

      {}
      <Button type='submit'>
        {id ? 'Save Changes' : 'Add Student Training'}
      </Button>
    </form>
  );
}
