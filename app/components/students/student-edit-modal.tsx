'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@/types/user';
import { StudentProfile, StudentEnrollment } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi, teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Edit schema - all fields optional except password change requires current password
const studentEditSchema = z.object({
  // Personal Information
  full_name_matric: z.string().min(1, 'Full name is required').optional(),
  father_name: z.string().min(1, 'Father\'s name is required').optional(),
  cnic_bform_no: z.string()
    .min(11, 'CNIC/B-Form must be at least 11 digits')
    .max(13, 'CNIC/B-Form must be at most 13 digits')
    .regex(/^\d+$/, 'CNIC/B-Form must contain only digits')
    .optional(),
  date_of_birth: z.string().refine((date) => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  }, 'Date of birth cannot be in the future').optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  nationality: z.enum(['Pakistani', 'Dual National']).optional(),
  domicile: z.enum(['Punjab', 'Sindh', 'KP', 'Balochistan', 'AJK', 'GB']).optional(),
  religion: z.string().min(1, 'Religion is required').optional(),
  blood_group: z.string().optional(),
  marital_status: z.enum(['Single', 'Married']).optional(),
  
  // Contact Information
  mobile_number: z.string()
    .regex(/^03\d{2}-\d{7}$/, 'Mobile number must be in format 03XX-XXXXXXX')
    .optional(),
  permanent_address: z.string().min(1, 'Permanent address is required').optional(),
  postal_address: z.string().optional(),
  province: z.string().min(1, 'Province is required').optional(),
  city_district: z.string().min(1, 'City/District is required').optional(),
  
  // Emergency Contact
  emergency_contact_person: z.string().min(1, 'Emergency contact person is required').optional(),
  emergency_contact_number: z.string()
    .regex(/^03\d{2}-\d{7}$/, 'Emergency contact must be in format 03XX-XXXXXXX')
    .optional(),
  
  // Password change - completely optional
  current_password: z.string().optional(),
  new_password: z
    .string()
    .optional()
    .refine((pwd) => {
      // Only validate if password is provided (not empty or undefined)
      if (!pwd || pwd.trim() === '') return true; // Empty is valid (optional)
      if (pwd.length < 8) return false;
      if (pwd.length > 72) return false;
      if (!/[A-Z]/.test(pwd)) return false;
      if (!/[a-z]/.test(pwd)) return false;
      if (!/[0-9]/.test(pwd)) return false;
      return true;
    }, {
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    }),
}).refine((data) => {
  // If new_password is provided and not empty, current_password is required
  const hasNewPassword = data.new_password && data.new_password.trim() !== '';
  const hasCurrentPassword = data.current_password && data.current_password.trim() !== '';
  
  if (hasNewPassword && !hasCurrentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to change password',
  path: ['current_password'],
});

type StudentEditForm = z.infer<typeof studentEditSchema>;

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User & { profile?: StudentProfile | null; enrollments?: StudentEnrollment[] };
  classes?: Array<{ id: string; name: string }>; // Not used but kept for consistency
  api?: typeof adminApi | typeof teacherApi; // Allow passing different API
}

export default function StudentEditModal({
  isOpen,
  onClose,
  student,
  classes,
  api = adminApi,
}: StudentEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StudentEditForm>({
    resolver: zodResolver(studentEditSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const newPassword = watch('new_password');

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
    if (isOpen && student) {
      // Pre-fill form with student data
      const profile = student.profile;
      const enrollment = student.enrollments?.[0];
      
      if (profile) {
        setValue('full_name_matric', profile.full_name_matric);
        setValue('father_name', profile.father_name);
        setValue('cnic_bform_no', profile.cnic_bform_no);
        setValue('date_of_birth', profile.date_of_birth.split('T')[0]); // Format date for input
        setValue('gender', profile.gender as 'Male' | 'Female' | 'Other');
        setValue('nationality', profile.nationality as 'Pakistani' | 'Dual National');
        setValue('domicile', profile.domicile as 'Punjab' | 'Sindh' | 'KP' | 'Balochistan' | 'AJK' | 'GB');
        setValue('religion', profile.religion);
        setValue('blood_group', profile.blood_group || '');
        setValue('marital_status', profile.marital_status as 'Single' | 'Married');
        // Format mobile number for display
        const formattedMobile = profile.mobile_number.replace(/^(\d{4})(\d{7})$/, '$1-$2');
        setValue('mobile_number', formattedMobile);
        setValue('permanent_address', profile.permanent_address);
        setValue('postal_address', profile.postal_address || '');
        setValue('province', profile.province);
        setValue('city_district', profile.city_district);
        setValue('emergency_contact_person', profile.emergency_contact_person);
        // Format emergency contact number for display
        const formattedEmergency = profile.emergency_contact_number.replace(/^(\d{4})(\d{7})$/, '$1-$2');
        setValue('emergency_contact_number', formattedEmergency);
      }
      
      // Note: class_id and section_id are not editable (roll number depends on them)
    } else {
      reset();
    }
  }, [isOpen, student, setValue, reset]);

  if (!isOpen || !student) return null;

  const onFormSubmit = async (data: StudentEditForm) => {
    setIsSubmitting(true);
    try {
      // Prepare update data (exclude password fields)
      const updateData: any = {
        full_name_matric: data.full_name_matric,
        father_name: data.father_name,
        cnic_bform_no: data.cnic_bform_no ? data.cnic_bform_no.replace(/\D/g, '') : undefined,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        nationality: data.nationality,
        domicile: data.domicile,
        religion: data.religion,
        blood_group: data.blood_group,
        marital_status: data.marital_status,
        mobile_number: data.mobile_number ? data.mobile_number.replace(/\D/g, '') : undefined,
        permanent_address: data.permanent_address,
        postal_address: data.postal_address,
        province: data.province,
        city_district: data.city_district,
        emergency_contact_person: data.emergency_contact_person,
        emergency_contact_number: data.emergency_contact_number ? data.emergency_contact_number.replace(/\D/g, '') : undefined,
      };

      // Remove undefined and empty string fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Update student profile if there are fields to update
      if (Object.keys(updateData).length > 0) {
        await api.updateStudentProfile(student.id, updateData);
      }

      // Handle password change separately if provided (and not empty)
      // Note: teacherApi doesn't have changeStudentPassword, so only use if available
      if (
        data.new_password && 
        data.new_password.trim() !== '' && 
        data.current_password && 
        data.current_password.trim() !== '' &&
        'changeStudentPassword' in api
      ) {
        await (api as typeof adminApi).changeStudentPassword(student.id, {
          current_password: data.current_password,
          new_password: data.new_password,
        });
      }

      toast.success('Student updated successfully');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to update student';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0];
  const enrollment = student.enrollments?.[0];
  const profile = student.profile;

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
              <h2 className="text-2xl font-bold text-white">Edit Student</h2>
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
            {/* Account Information (Read-only) */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address (Unchangeable)
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number (Unchangeable)
                  </label>
                  <input
                    type="text"
                    value={enrollment?.roll_number || 'Not assigned'}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

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
                    <option value="">Select Gender</option>
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
                    <option value="">Select Nationality</option>
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
                    <option value="">Select Domicile</option>
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
                    <option value="">Select Marital Status</option>
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

            {/* Section 4: Password Change */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password to change"
                  error={errors.current_password?.message}
                  {...register('current_password')}
                />
                
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters with uppercase, lowercase, and number"
                  error={errors.new_password?.message}
                  {...register('new_password')}
                />
              </div>
              {newPassword && (
                <p className="mt-2 text-xs text-gray-500">
                  * Current password is required to change password
                </p>
              )}
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
            className="min-w-[120px]"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

