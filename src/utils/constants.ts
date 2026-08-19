/* eslint-disable @typescript-eslint/no-unused-vars */
import { Beneficiary, School, Student } from './types';

export const configurationItems: {
  title: string;
  href: string;
  description: string;
}[] = [
  {
    title: 'Training Programs',
    href: '/configuration?type=training',
    description: 'Add/Edit Training Programs.',
  },
  {
    title: 'Devices',
    href: '/configuration?type=devices',
    description: 'Add/Edit Devices.',
  },
  {
    title: 'Users',
    href: '/configuration?type=users',
    description: 'Add/Edit Devices.',
  },
];

export const reportItems: {
  title: string;
  href: string;
  description: string;
}[] = [
  {
    title: 'Student Devices and Training',
    href: '/reports?type=beneficiaries',
    description:
      'Export student device and training enrollments as excel sheet.',
  },
  {
    title: 'Grants',
    href: '/reports?type=grants',
    description: 'Export quarterly reports of school grants as an excel sheet.',
  },
];

export const defaultStudentValues: Student = {
  id: '1',
  firstName: '',
  lastName: '',
  dateOfBirth: new Date(),
  gender: 'F',
  visualAcuity: 'Blind',
  className: '11',
  aadharNumber: '',
  city: '',
  phoneNumber: '',
  email: '',
  govDisabilityCert: 'Y',
  school: undefined,
};

export function getAge(date: Date) {
  const today = new Date();
  const birthDate = new Date(date);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export enum VIEWS {
  EDIT = 'edit',
  CREATE = 'create',
  TABLE = 'table',
  DETAILS = 'details',
}

/*export const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Pooja',
    lastName: 'Kirtane',
    dateOfBirth: new Date('2015-12-17T03:24:00'),
    gender: 'F',
    visualAcuity: 'Blind',
    className: 'FYBA',
    aadharNumber: '686863254760',
    city: 'Pune',
    phoneNumber: '9552469987',
    email: 'Pooja.Kirtane@gmail.com',
    govDisabilityCert: 'Y',
  },
  {
    id: '2',
    firstName: 'Kaveri',
    lastName: 'Gawali',
    dateOfBirth: new Date('2011-09-17T03:24:00'),
    gender: 'F',
    visualAcuity: 'LV',
    className: '11',
    aadharNumber: '402623715545',
    city: 'Pune',
    phoneNumber: '8468806854',
    email: 'Kaveri.Gawali@gmail.com',
    govDisabilityCert: 'Y',
  },
  {
    id: '3',
    firstName: 'Shravani',
    lastName: 'Bhakad',
    dateOfBirth: new Date('2010-07-20T03:24:00'),
    gender: 'F',
    visualAcuity: 'LV',
    className: 'FYBA',
    aadharNumber: '860041758340',
    city: 'Pune',
    phoneNumber: '9359827032',
    email: 'Shravani.Bhakad@gmail.com',
    govDisabilityCert: 'Y',
  },
  {
    id: '4',
    firstName: 'Vaibhavi',
    lastName: 'Sutar',
    dateOfBirth: new Date('2012-11-22T03:24:00'),
    gender: 'F',
    visualAcuity: 'Blind',
    className: 'SYBA',
    aadharNumber: '567789329104',
    city: 'Pune',
    phoneNumber: '7020509877',
    email: 'Vaibhavi.Sutar@gmail.com',
    govDisabilityCert: 'Y',
  },
  {
    id: '5',
    firstName: 'Jyoti',
    lastName: 'Pate',
    dateOfBirth: new Date('2010-02-01T03:24:00'),
    gender: 'F',
    visualAcuity: 'Blind',
    className: '11',
    aadharNumber: '573382031654',
    city: 'Pune',
    phoneNumber: '9359827032',
    email: 'Jyoti.Pate@gmail.com',
    govDisabilityCert: 'Y',
  },
];

export const mockSchools: School[] = [
  {
    id: '1',
    name: 'Science High School',
  },
  {
    id: '2',
    name: 'Engineering University',
  },
];

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: '1',
    school: mockSchools[1],
    student: mockStudents[0],
    deviceId: '125',
    issueDate: new Date('2025-02-04T03:24:00'),
    deviceType: 'SP',
  },
  {
    id: '2',
    school: mockSchools[1],
    student: mockStudents[1],
    deviceId: '514',
    issueDate: new Date('2025-02-12T03:24:00'),
    deviceType: 'TB',
  },
  {
    id: '3',
    school: mockSchools[0],
    student: mockStudents[2],
    deviceId: '677',
    issueDate: new Date('2025-02-10T03:24:00'),
    deviceType: 'SP',
  },
  {
    id: '4',
    school: mockSchools[1],
    student: mockStudents[3],
    deviceId: '476',
    issueDate: new Date('2025-02-21T03:24:00'),
    deviceType: 'TB',
  },
  {
    id: '5',
    school: mockSchools[0],
    student: mockStudents[4],
    deviceId: '542',
    issueDate: new Date('2025-02-17T03:24:00'),
    deviceType: 'SVG',
  },
];
*/
