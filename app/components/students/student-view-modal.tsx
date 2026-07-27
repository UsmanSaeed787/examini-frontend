'use client';

import { User } from '@/types/user';
import { StudentProfile, StudentEnrollment } from '@/types/student';
import { Button } from '@/components/ui/button';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User & { profile?: StudentProfile | null; enrollments?: StudentEnrollment[] };
}

export default function StudentViewModal({
  isOpen,
  onClose,
  student,
}: StudentViewModalProps) {
  if (!isOpen || !student) return null;

  const profile = student.profile;
  const enrollment = student.enrollments?.[0];

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
    // If already formatted, return as is, otherwise format it
    if (phone.includes('-')) return phone;
    if (phone.length === 11) {
      return `${phone.slice(0, 4)}-${phone.slice(4)}`;
    }
    return phone;
  };

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
              <h2 className="text-2xl font-bold text-white">Student Information</h2>
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto modal-scrollbar p-6 bg-gradient-to-b from-gray-50 to-white">
          {!profile ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Student profile not found</p>
              <p className="text-gray-400 text-sm mt-2">This student does not have a profile registered yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{student.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Roll Number</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{enrollment?.roll_number || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account Status</label>
                    <div className={`border rounded-lg px-4 py-3 ${student.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Verified</label>
                    <div className={`border rounded-lg px-4 py-3 ${student.email_verified ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${student.email_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {student.email_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name (as per Matric Certificate)</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.full_name_matric}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Father's Name</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.father_name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CNIC / B-Form No</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 font-mono">{profile.cnic_bform_no}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date of Birth</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{formatDate(profile.date_of_birth)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.gender}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nationality</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.nationality}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Domicile</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.domicile}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Religion</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.religion || 'N/A'}</p>
                    </div>
                  </div>
                  {profile.blood_group && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Blood Group</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{profile.blood_group}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marital Status</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.marital_status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mobile Number</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(profile.mobile_number)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Province</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.province}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permanent Address</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.permanent_address}</p>
                    </div>
                  </div>
                  {profile.postal_address && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Postal Address</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{profile.postal_address}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">City / District</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.city_district}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact Person</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{profile.emergency_contact_person}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact Number</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(profile.emergency_contact_number)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              {enrollment && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Enrolled At</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{formatDate(enrollment.enrolled_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[100px]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

