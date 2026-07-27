export interface StudentProfile {
  id: string;
  user_id: string;
  full_name_matric: string;
  father_name: string;
  cnic_bform_no: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  nationality: 'Pakistani' | 'Dual National';
  domicile: 'Punjab' | 'Sindh' | 'KP' | 'Balochistan' | 'AJK' | 'GB';
  religion: string;
  blood_group?: string | null;
  marital_status: 'Single' | 'Married';
  mobile_number: string;
  permanent_address: string;
  postal_address?: string | null;
  province: string;
  city_district: string;
  emergency_contact_person: string;
  emergency_contact_number: string;
  created_at: string;
  updated_at: string;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  roll_number?: string | null;
  enrolled_at: string;
}

export interface StudentDetail {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  profile?: StudentProfile | null;
  enrollments: StudentEnrollment[];
}

export interface StudentRegistrationForm {
  // Personal Information
  full_name_matric: string;
  father_name: string;
  cnic_bform_no: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  nationality: 'Pakistani' | 'Dual National';
  domicile: 'Punjab' | 'Sindh' | 'KP' | 'Balochistan' | 'AJK' | 'GB';
  religion: string;
  blood_group?: string;
  marital_status: 'Single' | 'Married';
  
  // Contact Information
  mobile_number: string;
  email: string;
  permanent_address: string;
  postal_address?: string;
  province: string;
  city_district: string;
  
  // Emergency Contact
  emergency_contact_person: string;
  emergency_contact_number: string;
  
  // Academic Information
  class_id: string;
  section_id: string;
  password?: string; // Optional, can be auto-generated
}

