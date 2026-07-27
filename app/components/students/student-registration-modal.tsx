'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StudentRegistrationForm } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi, teacherApi } from '@/lib/api';

// Comprehensive validation schema
const studentRegistrationSchema = z.object({
  // Personal Information
  full_name_matric: z.string().min(1, 'Full name is required'),
  father_name: z.string().min(1, 'Father\'s name is required'),
  cnic_bform_no: z.string()
    .min(11, 'CNIC/B-Form must be at least 11 digits')
    .max(13, 'CNIC/B-Form must be at most 13 digits')
    .regex(/^\d+$/, 'CNIC/B-Form must contain only digits'),
  date_of_birth: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  }, 'Date of birth cannot be in the future'),
  gender: z.enum(['Male', 'Female', 'Other']),
  nationality: z.enum(['Pakistani', 'Dual National']),
  domicile: z.enum(['Punjab', 'Sindh', 'KP', 'Balochistan', 'AJK', 'GB']),
  religion: z.string().min(1, 'Religion is required'),
  blood_group: z.string().optional(),
  marital_status: z.enum(['Single', 'Married']),
  
  // Contact Information
  mobile_number: z.string()
    .regex(/^03\d{2}-\d{7}$/, 'Mobile number must be in format 03XX-XXXXXXX'),
  // Email is passed as prop, not validated in schema
  permanent_address: z.string().min(1, 'Permanent address is required'),
  postal_address: z.string().optional(),
  province: z.string().min(1, 'Province is required'),
  city_district: z.string().min(1, 'City/District is required'),
  
  // Emergency Contact
  emergency_contact_person: z.string().min(1, 'Emergency contact person is required'),
  emergency_contact_number: z.string()
    .regex(/^03\d{2}-\d{7}$/, 'Emergency contact must be in format 03XX-XXXXXXX'),
  
  // Academic Information
  class_id: z.string().min(1, 'Class is required'),
  section_id: z.string().min(1, 'Section is required'),
  password: z.string().optional(),
  // Email is passed as prop, not in form
});

type StudentFormData = z.infer<typeof studentRegistrationSchema>;

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentRegistrationForm) => Promise<void>;
  classes: Array<{ id: string; name: string }>;
  email: string; // Email from user creation modal
  api?: typeof adminApi | typeof teacherApi; // For fetching sections
}

export default function StudentRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  classes,
  email,
  api = adminApi,
}: StudentRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [generatedRollNumber, setGeneratedRollNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      gender: 'Male',
      nationality: 'Pakistani',
      domicile: 'Punjab',
      marital_status: 'Single',
    },
  });

  const watchedClassId = watch('class_id');
  const watchedSectionId = watch('section_id');

  // Format phone number input
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
  };

  // Format CNIC/B-Form
  const formatCNIC = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 13);
  };

  /**
   * A registered field that reformats as you type.
   *
   * `{...register(name)}` has to be spread before any onChange of ours, because
   * whichever comes last wins — spreading it after silently replaced these
   * formatters, so nothing was being formatted. Here the field is spread first
   * and its own onChange is called with the already-reformatted value.
   */
  const formattedField = (
    name: 'cnic_bform_no' | 'mobile_number' | 'emergency_contact_number',
    format: (value: string) => string
  ) => {
    const field = register(name);
    return {
      ...field,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        event.target.value = format(event.target.value);
        return field.onChange(event);
      },
    };
  };

  useEffect(() => {
    if (watchedClassId && watchedClassId !== selectedClassId) {
      setSelectedClassId(watchedClassId);
      setValue('section_id', '');
      setGeneratedRollNumber(null);
      fetchSections(watchedClassId);
    }
  }, [watchedClassId, setValue]);

  const fetchSections = async (classId: string) => {
    try {
      setLoadingSections(true);
      // Use adminApi.getSections since both admin and teacher can access sections
      const data = await adminApi.getSections(classId);
      setSections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sections:', error);
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedClassId('');
      setSections([]);
      setGeneratedRollNumber(null);
      // Email is pre-filled from prop
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      // Format data for backend
      const submitData: StudentRegistrationForm = {
        ...data,
        email: email, // Use email from prop
        cnic_bform_no: data.cnic_bform_no.replace(/\D/g, ''),
        mobile_number: data.mobile_number.replace(/\D/g, ''),
        emergency_contact_number: data.emergency_contact_number.replace(/\D/g, ''),
        password: data.password || undefined,
      };
      await onSubmit(submitData);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col modal-enter transform translateZ(0)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 px-6 py-5 rounded-t-2xl flex-shrink-0 border-b-2 border-primary-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-primary-600 font-bold text-xl">E</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Student Registration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-red-500 hover:bg-opacity-90 rounded-lg p-2 transition-all duration-200 ease-out w-10 h-10 flex items-center justify-center group transform translateZ(0)"
              aria-label="Close"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200 ease-out" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <div className="flex-1 overflow-y-auto modal-scrollbar p-6 bg-gradient-to-b from-gray-50 to-white">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name (as per Matric Certificate) *"
                  type="text"
                  placeholder="Enter full name"
                  error={errors.full_name_matric?.message}
                  {...register('full_name_matric')}
                />
                
                <Input
                  label="Father's Name *"
                  type="text"
                  placeholder="Enter father's name"
                  error={errors.father_name?.message}
                  {...register('father_name')}
                />
                
                <Input
                  label="CNIC / B-Form No *"
                  type="text"
                  placeholder="11 or 13 digits"
                  error={errors.cnic_bform_no?.message}
                  maxLength={13}
                  {...formattedField('cnic_bform_no', formatCNIC)}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth * (Not future date)
                  </label>
                  <input
                    type="date"
                    max={maxDate}
                    min={minDate}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('date_of_birth')}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('gender')}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('nationality')}
                  >
                    <option value="Pakistani">Pakistani</option>
                    <option value="Dual National">Dual National</option>
                  </select>
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationality.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domicile *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('domicile')}
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="KP">KP</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="AJK">AJK</option>
                    <option value="GB">GB</option>
                  </select>
                  {errors.domicile && (
                    <p className="mt-1 text-sm text-red-600">{errors.domicile.message}</p>
                  )}
                </div>
                
                <Input
                  label="Religion *"
                  type="text"
                  placeholder="e.g., Islam, Christianity"
                  error={errors.religion?.message}
                  {...register('religion')}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('blood_group')}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('marital_status')}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                  {errors.marital_status && (
                    <p className="mt-1 text-sm text-red-600">{errors.marital_status.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Mobile Number * (03XX-XXXXXXX)"
                  type="text"
                  placeholder="03XX-XXXXXXX"
                  maxLength={12}
                  error={errors.mobile_number?.message}
                  {...formattedField('mobile_number', formatPhoneNumber)}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address * (from user account)
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email is set from the user account and cannot be changed here</p>
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    label="Permanent Address *"
                    type="text"
                    placeholder="House #, Street #, City, District"
                    error={errors.permanent_address?.message}
                    {...register('permanent_address')}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    label="Postal Address (if different)"
                    type="text"
                    placeholder="Leave empty if same as permanent address"
                    error={errors.postal_address?.message}
                    {...register('postal_address')}
                  />
                </div>
                
                <Input
                  label="Province *"
                  type="text"
                  placeholder="e.g., Punjab, Sindh"
                  error={errors.province?.message}
                  {...register('province')}
                />
                
                <Input
                  label="City / District *"
                  type="text"
                  placeholder="e.g., Lahore, Karachi, Islamabad"
                  error={errors.city_district?.message}
                  {...register('city_district')}
                />
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Person * (Father Contact Number)"
                  type="text"
                  placeholder="Enter contact person name"
                  error={errors.emergency_contact_person?.message}
                  {...register('emergency_contact_person')}
                />
                
                <Input
                  label="Emergency Contact Number * (03XX-XXXXXXX)"
                  type="text"
                  placeholder="03XX-XXXXXXX"
                  maxLength={12}
                  error={errors.emergency_contact_number?.message}
                  {...formattedField('emergency_contact_number', formatPhoneNumber)}
                />
              </div>
            </div>

            {/* Section 4: Academic Information */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    {...register('class_id')}
                    onChange={(e) => {
                      setValue('class_id', e.target.value);
                      setValue('section_id', '');
                      setGeneratedRollNumber(null);
                    }}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  {errors.class_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white disabled:bg-gray-100"
                    disabled={!watchedClassId || loadingSections}
                    {...register('section_id')}
                    onChange={(e) => {
                      setValue('section_id', e.target.value);
                      setGeneratedRollNumber(null);
                    }}
                  >
                    <option value="">
                      {loadingSections ? 'Loading...' : !watchedClassId ? 'Select class first' : 'Select Section'}
                    </option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                  {errors.section_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.section_id.message}</p>
                  )}
                </div>
                
                {watchedClassId && watchedSectionId && (
                  <div className="md:col-span-2">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Roll number will be auto-generated after submission based on class and section.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <Input
                    label="Password (Optional - will be auto-generated if left empty)"
                    type="password"
                    placeholder="Leave empty for auto-generated password"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            variant="primary"
            isLoading={isSubmitting}
            className="min-w-[140px]"
          >
            Register Student
          </Button>
        </div>
      </div>
    </div>
  );
}

