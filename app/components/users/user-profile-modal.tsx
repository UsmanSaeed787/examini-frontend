'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@/types/user';
import { StudentProfile, StudentEnrollment } from '@/types/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import LoggingOutModal from '@/components/user/logging-out-modal';

const userProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
});

const studentProfileSchema = z.object({
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
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
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
});

type UserProfileForm = z.infer<typeof userProfileSchema>;
type StudentProfileForm = z.infer<typeof studentProfileSchema>;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
}: UserProfileModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { logout, setUser } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
  });

  const {
    register: registerStudent,
    handleSubmit: handleStudentSubmit,
    formState: { errors: studentErrors, isSubmitting: isStudentSubmitting },
    reset: resetStudent,
    setValue: setStudentValue,
    watch: watchStudent,
  } = useForm<StudentProfileForm>({
    resolver: zodResolver(studentProfileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    if (isOpen && user) {
      setValue('full_name', user.full_name || '');
      setValue('email', user.email || '');
      setMode('view');
      setShowDeleteConfirm(false);
      // Fetch complete student profile if user is a student
      if (user.role === 'student') {
        fetchStudentProfile();
      } else {
        setStudentData(null);
      }
    }
  }, [isOpen, user, setValue]);

  // Populate student form when studentData is loaded
  useEffect(() => {
    if (studentData?.profile) {
      const profile = studentData.profile;
      setStudentValue('full_name_matric', profile.full_name_matric || '');
      setStudentValue('father_name', profile.father_name || '');
      setStudentValue('cnic_bform_no', profile.cnic_bform_no || '');
      setStudentValue('date_of_birth', profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '');
      setStudentValue('gender', profile.gender as 'Male' | 'Female' | 'Other');
      setStudentValue('nationality', profile.nationality as 'Pakistani' | 'Dual National');
      setStudentValue('domicile', profile.domicile as 'Punjab' | 'Sindh' | 'KP' | 'Balochistan' | 'AJK' | 'GB');
      setStudentValue('religion', profile.religion || '');
      setStudentValue('blood_group', profile.blood_group as any);
      setStudentValue('marital_status', profile.marital_status as 'Single' | 'Married');
      
      // Format phone numbers for display
      const formattedMobile = profile.mobile_number?.replace(/^(\d{4})(\d{7})$/, '$1-$2') || '';
      setStudentValue('mobile_number', formattedMobile);
      setStudentValue('permanent_address', profile.permanent_address || '');
      setStudentValue('postal_address', profile.postal_address || '');
      setStudentValue('province', profile.province || '');
      setStudentValue('city_district', profile.city_district || '');
      setStudentValue('emergency_contact_person', profile.emergency_contact_person || '');
      const formattedEmergency = profile.emergency_contact_number?.replace(/^(\d{4})(\d{7})$/, '$1-$2') || '';
      setStudentValue('emergency_contact_number', formattedEmergency);
    }
  }, [studentData, setStudentValue]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getProfile();
      setStudentData(data);
    } catch (error: any) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    if (phone.includes('-')) return phone;
    if (phone.length === 11) {
      return `${phone.slice(0, 4)}-${phone.slice(4)}`;
    }
    return phone;
  };

  // Format phone number input
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
  };

  // Format CNIC/B-Form
  const formatCNIC = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 13);
  };

  const handleEdit = () => {
    setMode('edit');
  };

  const handleCancel = () => {
    setMode('view');
    if (user) {
      setValue('full_name', user.full_name || '');
      setValue('email', user.email || '');
    }
    // Reset student form
    if (studentData?.profile) {
      const profile = studentData.profile;
      setStudentValue('full_name_matric', profile.full_name_matric || '');
      setStudentValue('father_name', profile.father_name || '');
      setStudentValue('cnic_bform_no', profile.cnic_bform_no || '');
      setStudentValue('date_of_birth', profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '');
      setStudentValue('gender', profile.gender as 'Male' | 'Female' | 'Other');
      setStudentValue('nationality', profile.nationality as 'Pakistani' | 'Dual National');
      setStudentValue('domicile', profile.domicile as 'Punjab' | 'Sindh' | 'KP' | 'Balochistan' | 'AJK' | 'GB');
      setStudentValue('religion', profile.religion || '');
      setStudentValue('blood_group', profile.blood_group as any);
      setStudentValue('marital_status', profile.marital_status as 'Single' | 'Married');
      const formattedMobile = profile.mobile_number?.replace(/^(\d{4})(\d{7})$/, '$1-$2') || '';
      setStudentValue('mobile_number', formattedMobile);
      setStudentValue('permanent_address', profile.permanent_address || '');
      setStudentValue('postal_address', profile.postal_address || '');
      setStudentValue('province', profile.province || '');
      setStudentValue('city_district', profile.city_district || '');
      setStudentValue('emergency_contact_person', profile.emergency_contact_person || '');
      const formattedEmergency = profile.emergency_contact_number?.replace(/^(\d{4})(\d{7})$/, '$1-$2') || '';
      setStudentValue('emergency_contact_number', formattedEmergency);
    }
  };

  const onSubmit = async (data: UserProfileForm) => {
    try {
      const updatedUser = await authApi.updateProfile({
        full_name: data.full_name,
        email: data.email,
      });
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      setMode('view');
      // Refresh student data if student
      if (user?.role === 'student') {
        await fetchStudentProfile();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const onStudentProfileSubmit = async (data: StudentProfileForm) => {
    try {
      // Prepare update data - only include fields that have values
      const updateData: any = {};
      
      if (data.full_name_matric && data.full_name_matric.trim()) {
        updateData.full_name_matric = data.full_name_matric.trim();
      }
      if (data.father_name && data.father_name.trim()) {
        updateData.father_name = data.father_name.trim();
      }
      if (data.cnic_bform_no && data.cnic_bform_no.trim()) {
        updateData.cnic_bform_no = data.cnic_bform_no.replace(/\D/g, '');
      }
      if (data.date_of_birth && data.date_of_birth.trim()) {
        updateData.date_of_birth = data.date_of_birth; // Keep as string, backend will convert
      }
      if (data.gender) {
        updateData.gender = data.gender;
      }
      if (data.nationality) {
        updateData.nationality = data.nationality;
      }
      if (data.domicile) {
        updateData.domicile = data.domicile;
      }
      if (data.religion && data.religion.trim()) {
        updateData.religion = data.religion.trim();
      }
      if (data.blood_group) {
        updateData.blood_group = data.blood_group;
      }
      if (data.marital_status) {
        updateData.marital_status = data.marital_status;
      }
      if (data.mobile_number && data.mobile_number.trim()) {
        updateData.mobile_number = data.mobile_number.replace(/\D/g, '');
      }
      if (data.permanent_address && data.permanent_address.trim()) {
        updateData.permanent_address = data.permanent_address.trim();
      }
      if (data.postal_address && data.postal_address.trim()) {
        updateData.postal_address = data.postal_address.trim();
      }
      if (data.province && data.province.trim()) {
        updateData.province = data.province.trim();
      }
      if (data.city_district && data.city_district.trim()) {
        updateData.city_district = data.city_district.trim();
      }
      if (data.emergency_contact_person && data.emergency_contact_person.trim()) {
        updateData.emergency_contact_person = data.emergency_contact_person.trim();
      }
      if (data.emergency_contact_number && data.emergency_contact_number.trim()) {
        updateData.emergency_contact_number = data.emergency_contact_number.replace(/\D/g, '');
      }

      console.log('Updating student profile with data:', updateData);

      // Update student profile
      const updatedData = await authApi.updateStudentProfile(updateData);
      setStudentData(updatedData);
      setUser({ ...user!, ...updatedData });
      toast.success('Profile updated successfully');
      setMode('view');
      // Refresh profile data
      await fetchStudentProfile();
    } catch (error: any) {
      console.error('Error updating student profile:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsLoggingOut(true);
    
    try {
      await authApi.deleteAccount();
      toast.success('Account deleted successfully');
      await logout();
      router.push('/login');
      onClose();
    } catch (error: any) {
      setIsLoggingOut(false);
      toast.error(error.response?.data?.detail || 'Failed to delete account');
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col modal-enter transform translateZ(0)"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 px-6 py-5 rounded-t-2xl flex-shrink-0 border-b-2 border-primary-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                  {user.profile_image_url ? (
                    <img 
                      src={user.profile_image_url} 
                      alt={user.full_name || user.email}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-bold text-xl">
                      {(user.full_name || user.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">My Profile</h2>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto modal-scrollbar p-6 bg-gradient-to-b from-gray-50 to-white">
            {loading ? (
              <div className="space-y-6">
                {/* Account Information Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-5 bg-gray-200 rounded w-40 animate-shimmer"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-shimmer"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-shimmer"></div>
                      <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-shimmer"></div>
                      <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-28 mb-2 animate-shimmer"></div>
                      <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-32 mb-2 animate-shimmer"></div>
                      <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Student Profile Sections Skeleton */}
                {user?.role === 'student' && (
                  <>
                    {/* Personal Information Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                        <div className="h-5 bg-gray-200 rounded w-48 animate-shimmer"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="h-3 bg-gray-200 rounded w-32 mb-2 animate-shimmer"></div>
                            <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Information Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                        <div className="h-5 bg-gray-200 rounded w-44 animate-shimmer"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={i === 2 || i === 3 ? 'md:col-span-2' : ''} style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="h-3 bg-gray-200 rounded w-28 mb-2 animate-shimmer"></div>
                            <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Contact Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                        <div className="h-5 bg-gray-200 rounded w-40 animate-shimmer"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="h-3 bg-gray-200 rounded w-36 mb-2 animate-shimmer"></div>
                            <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Academic Information Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                        <div className="h-5 bg-gray-200 rounded w-48 animate-shimmer"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-shimmer"></div>
                          <div className="h-10 bg-gray-200 rounded animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Danger Zone Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-5 bg-gray-200 rounded w-32 animate-shimmer"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-96 mb-4 animate-shimmer"></div>
                  <div className="h-10 bg-gray-200 rounded w-32 animate-shimmer"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Account Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                    </div>
                    {mode === 'view' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                  
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Email Address {mode === 'edit' && <span className="text-red-500">*</span>}
                        </label>
                        {mode === 'edit' ? (
                          <>
                            <Input
                              {...register('email')}
                              type="email"
                              className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                          </>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                          </div>
                        )}
                      </div>
                      {user.role === 'student' && studentData?.enrollments?.[0] ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Roll Number</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{studentData.enrollments[0].roll_number || 'Not assigned'}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Full Name {mode === 'edit' && <span className="text-red-500">*</span>}
                          </label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...register('full_name')}
                                className={errors.full_name ? 'border-red-500' : ''}
                              />
                              {errors.full_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account Status</label>
                        <div className={`border rounded-lg px-4 py-3 ${user.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Verified</label>
                        <div className={`border rounded-lg px-4 py-3 ${user.email_verified ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.email_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.email_verified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {mode === 'edit' && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </form>
                </div>

                {/* Student Profile Information - Show all student details */}
                {user.role === 'student' && studentData?.profile && (
                  <>
                  <form onSubmit={handleStudentSubmit(onStudentProfileSubmit)}>
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name (as per Matric Certificate)</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('full_name_matric')}
                                className={studentErrors.full_name_matric ? 'border-red-500' : ''}
                              />
                              {studentErrors.full_name_matric && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.full_name_matric.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.full_name_matric}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Father's Name</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('father_name')}
                                className={studentErrors.father_name ? 'border-red-500' : ''}
                              />
                              {studentErrors.father_name && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.father_name.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.father_name}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CNIC / B-Form No</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('cnic_bform_no')}
                                maxLength={13}
                                onChange={(e) => {
                                  const formatted = formatCNIC(e.target.value);
                                  e.target.value = formatted;
                                  setStudentValue('cnic_bform_no', formatted);
                                }}
                                className={studentErrors.cnic_bform_no ? 'border-red-500' : ''}
                              />
                              {studentErrors.cnic_bform_no && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.cnic_bform_no.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900 font-mono">{studentData.profile.cnic_bform_no}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date of Birth</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                {...registerStudent('date_of_birth')}
                                className={studentErrors.date_of_birth ? 'border-red-500' : ''}
                              />
                              {studentErrors.date_of_birth && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.date_of_birth.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{formatDate(studentData.profile.date_of_birth)}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
                          {mode === 'edit' ? (
                            <>
                              <select
                                {...registerStudent('gender')}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${studentErrors.gender ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                              {studentErrors.gender && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.gender.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.gender}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nationality</label>
                          {mode === 'edit' ? (
                            <>
                              <select
                                {...registerStudent('nationality')}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${studentErrors.nationality ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Nationality</option>
                                <option value="Pakistani">Pakistani</option>
                                <option value="Dual National">Dual National</option>
                              </select>
                              {studentErrors.nationality && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.nationality.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.nationality}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Domicile</label>
                          {mode === 'edit' ? (
                            <>
                              <select
                                {...registerStudent('domicile')}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${studentErrors.domicile ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Domicile</option>
                                <option value="Punjab">Punjab</option>
                                <option value="Sindh">Sindh</option>
                                <option value="KP">KP</option>
                                <option value="Balochistan">Balochistan</option>
                                <option value="AJK">AJK</option>
                                <option value="GB">GB</option>
                              </select>
                              {studentErrors.domicile && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.domicile.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.domicile}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Religion</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('religion')}
                                className={studentErrors.religion ? 'border-red-500' : ''}
                              />
                              {studentErrors.religion && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.religion.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.religion || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Blood Group</label>
                          {mode === 'edit' ? (
                            <>
                              <select
                                {...registerStudent('blood_group')}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${studentErrors.blood_group ? 'border-red-500' : 'border-gray-300'}`}
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
                              {studentErrors.blood_group && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.blood_group.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.blood_group || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marital Status</label>
                          {mode === 'edit' ? (
                            <>
                              <select
                                {...registerStudent('marital_status')}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${studentErrors.marital_status ? 'border-red-500' : 'border-gray-300'}`}
                              >
                                <option value="">Select Marital Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                              </select>
                              {studentErrors.marital_status && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.marital_status.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.marital_status}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mobile Number</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('mobile_number')}
                                onChange={(e) => {
                                  const formatted = formatPhoneInput(e.target.value);
                                  e.target.value = formatted;
                                  setStudentValue('mobile_number', formatted);
                                }}
                                className={studentErrors.mobile_number ? 'border-red-500' : ''}
                              />
                              {studentErrors.mobile_number && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.mobile_number.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(studentData.profile.mobile_number)}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Province</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('province')}
                                className={studentErrors.province ? 'border-red-500' : ''}
                              />
                              {studentErrors.province && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.province.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.province}</p>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permanent Address</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('permanent_address')}
                                className={studentErrors.permanent_address ? 'border-red-500' : ''}
                              />
                              {studentErrors.permanent_address && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.permanent_address.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.permanent_address}</p>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Postal Address</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('postal_address')}
                                className={studentErrors.postal_address ? 'border-red-500' : ''}
                              />
                              {studentErrors.postal_address && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.postal_address.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.postal_address || 'N/A'}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">City / District</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('city_district')}
                                className={studentErrors.city_district ? 'border-red-500' : ''}
                              />
                              {studentErrors.city_district && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.city_district.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.city_district}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact Person</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('emergency_contact_person')}
                                className={studentErrors.emergency_contact_person ? 'border-red-500' : ''}
                              />
                              {studentErrors.emergency_contact_person && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.emergency_contact_person.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.profile.emergency_contact_person}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact Number</label>
                          {mode === 'edit' ? (
                            <>
                              <Input
                                {...registerStudent('emergency_contact_number')}
                                onChange={(e) => {
                                  const formatted = formatPhoneInput(e.target.value);
                                  e.target.value = formatted;
                                  setStudentValue('emergency_contact_number', formatted);
                                }}
                                className={studentErrors.emergency_contact_number ? 'border-red-500' : ''}
                              />
                              {studentErrors.emergency_contact_number && (
                                <p className="text-red-500 text-xs mt-1">{studentErrors.emergency_contact_number.message}</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(studentData.profile.emergency_contact_number)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {mode === 'edit' && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isStudentSubmitting}
                          className="flex-1"
                        >
                          {isStudentSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </form>

                    {/* Academic Information */}
                    {studentData.enrollments && studentData.enrollments.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentData.enrollments.map((enrollment: any, index: number) => (
                            <div key={index}>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Class</label>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {enrollment.class_name || 'N/A'}
                                  {enrollment.section_name && ` - ${enrollment.section_name}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Danger Zone */}
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-200"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 modal-enter transform translateZ(0)"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete your account? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logging Out Progress Modal */}
      <LoggingOutModal isOpen={isLoggingOut} />
    </>
  );
}

