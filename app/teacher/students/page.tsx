'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { User, UserRole } from '@/types/user';
import { StudentRegistrationForm } from '@/types/student';
import UserTable from '@/components/users/user-table';
import StudentRegistrationModal from '@/components/students/student-registration-modal';
import StudentEditModal from '@/components/students/student-edit-modal';
import StudentViewModal from '@/components/students/student-view-modal';
import DeleteConfirmModal from '@/components/users/delete-confirm-modal';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface PaginatedStudents {
  items: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [students, setStudents] = useState<PaginatedStudents | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStudentRegistrationModalOpen, setIsStudentRegistrationModalOpen] = useState(false);
  const [studentRegistrationEmail, setStudentRegistrationEmail] = useState<string>('');
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [isStudentViewModalOpen, setIsStudentViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const limit = 10;

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    if (initialized) {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'teacher') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      fetchClasses();
      fetchStudents();
    }
  }, [isAuthenticated, user, currentPage, selectedClassId]);

  const fetchClasses = async () => {
    try {
      // Get classes from admin-created classes table (assigned to teacher)
      const data = await teacherApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getStudents(
        selectedClassId || undefined,
        undefined,
        searchTerm || undefined,
        currentPage,
        limit
      );
      
      // Fetch full student details including profile
      if (data.items) {
        const studentsWithDetails = await Promise.all(
          data.items.map(async (s: User) => {
            try {
              const studentDetails = await teacherApi.getStudent(s.id);
              return { ...s, profile: studentDetails.profile, enrollments: studentDetails.enrollments };
            } catch (error) {
              console.error(`Failed to load student details for ${s.id}:`, error);
              return s;
            }
          })
        );
        setStudents({ ...data, items: studentsWithDetails });
      } else {
        setStudents(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegistration = async (studentData: StudentRegistrationForm) => {
    try {
      await teacherApi.registerStudent(studentData);
      toast.success('Student registered successfully');
      setIsStudentRegistrationModalOpen(false);
      fetchStudents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to register student';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdate = async (studentId: string, profileData: any) => {
    try {
      await teacherApi.updateStudentProfile(studentId, profileData);
      toast.success('Student updated successfully');
      setIsStudentEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to update student';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    
    try {
      await teacherApi.deleteStudent(selectedStudent.id);
      toast.success('Student deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete student');
    }
  };

  const openEditModal = async (student: User) => {
    try {
      // Fetch full student details
      const studentDetails = await teacherApi.getStudent(student.id);
      setSelectedStudent({ ...student, profile: studentDetails.profile, enrollments: studentDetails.enrollments });
      setIsStudentEditModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load student details');
      console.error('Error loading student:', error);
    }
  };

  const openDeleteModal = (student: User) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = async (student: User) => {
    try {
      // Fetch full student details
      const studentDetails = await teacherApi.getStudent(student.id);
      setSelectedStudent({ ...student, profile: studentDetails.profile, enrollments: studentDetails.enrollments });
      setIsStudentViewModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load student details');
      console.error('Error loading student:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setTimeout(() => fetchStudents(), 300);
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Student Management</h1>
            <p className="text-gray-400 mt-1">Manage all students</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="w-full md:w-auto flex items-center gap-2 shadow-glow hover:shadow-glow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Student</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-700 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-700 last:border-0">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-700 rounded w-20 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full animate-shimmer"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : students && students.items.length > 0 ? (
            <>
              <UserTable
                users={students.items}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onView={openViewModal}
                currentUserId={user?.id}
              />

              {/* Pagination */}
              {students.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-300 text-center sm:text-left">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, students.total)} of {students.total} students
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                        >
                          Previous
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: Math.min(5, students.pages) }, (_, i) => {
                            let pageNum;
                            if (students.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= students.pages - 2) {
                              pageNum = students.pages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  currentPage === pageNum
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <div className="sm:hidden text-sm text-gray-300">
                          Page {currentPage} of {students.pages}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(students.pages, prev + 1))}
                          disabled={currentPage === students.pages}
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <p className="text-gray-300 text-lg">No students found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || selectedClassId ? 'Try adjusting your filters' : 'No students enrolled in your classes yet'}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Create Student</h2>
              <p className="text-gray-400 mb-4">Enter student email to begin registration:</p>
              <Input
                type="email"
                placeholder="student@example.com"
                value={studentRegistrationEmail}
                onChange={(e) => setStudentRegistrationEmail(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (studentRegistrationEmail) {
                      setIsCreateModalOpen(false);
                      setIsStudentRegistrationModalOpen(true);
                    } else {
                      toast.error('Please enter an email address');
                    }
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  Continue
                </Button>
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setStudentRegistrationEmail('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isStudentRegistrationModalOpen && (
          <StudentRegistrationModal
            isOpen={isStudentRegistrationModalOpen}
            onClose={() => {
              setIsStudentRegistrationModalOpen(false);
              setStudentRegistrationEmail('');
            }}
            onSubmit={handleStudentRegistration}
            classes={classes}
            email={studentRegistrationEmail}
          />
        )}

        {isStudentViewModalOpen && selectedStudent && selectedStudent.role === UserRole.STUDENT && (
          <StudentViewModal
            isOpen={isStudentViewModalOpen}
            onClose={() => {
              setIsStudentViewModalOpen(false);
              setSelectedStudent(null);
            }}
            student={selectedStudent}
          />
        )}

        {isStudentEditModalOpen && selectedStudent && selectedStudent.role === UserRole.STUDENT && (
          <StudentEditModal
            isOpen={isStudentEditModalOpen}
            onClose={() => {
              setIsStudentEditModalOpen(false);
              setSelectedStudent(null);
              fetchStudents();
            }}
            student={selectedStudent}
            classes={classes}
            api={teacherApi}
          />
        )}

        {isDeleteModalOpen && selectedStudent && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedStudent(null);
            }}
            onConfirm={handleDelete}
            userName={selectedStudent.full_name || selectedStudent.email}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
