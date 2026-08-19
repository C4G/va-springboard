/* eslint-disable @typescript-eslint/no-explicit-any */
export type Student = {
  school: any;
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  visualAcuity: string;
  className: string;
  aadharNumber: string;
  city: string;
  phoneNumber: string;
  email: string;
  govDisabilityCert: string;
  schoolId?: string;
};

export type School = {
  id: string;
  name: string;
};

export type Beneficiary = {
  id: string;
  school: School;
  student: Student;
  deviceId: string;
  issueDate: Date;
  deviceType: string;
};
