'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { adminApi } from '@/lib/api';
import { User, UserRole, UserCreate, UserUpdate } from '@/types/user';
import { StudentRegistrationForm } from '@/types/student';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserTable from '@/components/users/user-table';
import UserModal from '@/components/users/user-modal';
import DeleteConfirmModal from '@/components/users/delete-confirm-modal';
import StudentRegistrationModal from '@/components/students/student-registration-modal';
import StudentEditModal from '@/components/students/student-edit-modal';
import StudentViewModal from '@/components/students/student-view-modal';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStudentRegistrationModalOpen, setIsStudentRegistrationModalOpen] = useState(false);
  const [studentRegistrationEmail, setStudentRegistrationEmail] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [isStudentViewModalOpen, setIsStudentViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

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
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    // Get role from URL params
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setRoleFilter(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialized && isAuthenticated && user?.role === 'admin') {
      fetchUsers();
      fetchClasses();
    }
  }, [initialized, isAuthenticated, user, currentPage, roleFilter]);

  const fetchClasses = async () => {
    try {
      const data = await adminApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(
        currentPage,
        limit,
        roleFilter || undefined,
        searchTerm || undefined
      );
      
      // For students, fetch their full details including profile
      if (data.items) {
        const usersWithDetails = await Promise.all(
          data.items.map(async (u: User) => {
            if (u.role === UserRole.STUDENT) {
              try {
                const studentDetails = await adminApi.getStudent(u.id);
                return { ...u, profile: studentDetails.profile, enrollments: studentDetails.enrollments };
              } catch (error) {
                console.error(`Failed to load student details for ${u.id}:`, error);
                return u;
              }
            }
            return u;
          })
        );
        setUsers({ ...data, items: usersWithDetails });
      } else {
        setUsers(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setTimeout(() => fetchUsers(), 300); // Debounce search
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
    // Update URL
    if (role) {
      router.push(`/users?role=${role}`);
    } else {
      router.push('/users');
    }
  };

  const handleCreate = async (userData: UserCreate) => {
    // If creating a student, redirect to student registration modal with email
    if (userData.role === UserRole.STUDENT) {
      setIsCreateModalOpen(false);
      setStudentRegistrationEmail(userData.email);
      setIsStudentRegistrationModalOpen(true);
      return;
    }
    
    try {
      await adminApi.createUser(userData);
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      // Handle validation errors from backend
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to create user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleStudentRegistration = async (studentData: StudentRegistrationForm) => {
    try {
      await adminApi.registerStudent(studentData);
      toast.success('Student registered successfully');
      setIsStudentRegistrationModalOpen(false);
      fetchUsers();
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

  const handleUpdate = async (userId: string, userData: UserUpdate) => {
    // Prevent updating admin users
    const userToUpdate = users?.items.find(u => u.id === userId);
    if (userToUpdate?.role === 'admin') {
      toast.error('Admin users cannot be edited');
      return;
    }
    
    try {
      await adminApi.updateUser(userId, userData);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to update user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    // Prevent deleting admin users
    if (selectedUser.role === 'admin') {
      toast.error('Admin users cannot be deleted');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      return;
    }
    
    try {
      await adminApi.deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const openEditModal = async (user: User) => {
    // Prevent editing admin users
    if (user.role === 'admin') {
      toast.error('Admin users cannot be edited');
      return;
    }
    
    // If editing a student, use student edit modal
    if (user.role === UserRole.STUDENT) {
      try {
        // Fetch full student details
        const studentDetails = await adminApi.getStudent(user.id);
        setSelectedUser({ ...user, profile: studentDetails.profile, enrollments: studentDetails.enrollments });
        setIsStudentEditModalOpen(true);
      } catch (error: any) {
        toast.error('Failed to load student details');
        console.error('Error loading student:', error);
      }
      return;
    }
    
    // For teachers and other non-student users, use regular edit modal
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    // Prevent deleting admin users
    if (user.role === 'admin') {
      toast.error('Admin users cannot be deleted');
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = async (user: User) => {
    // Only for students
    if (user.role !== UserRole.STUDENT) {
      return;
    }
    
    try {
      // Fetch full student details
      const studentDetails = await adminApi.getStudent(user.id);
      setSelectedUser({ ...user, profile: studentDetails.profile, enrollments: studentDetails.enrollments });
      setIsStudentViewModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load student details');
      console.error('Error loading student:', error);
    }
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
      <DashboardLayout role="admin">
        <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">Manage all users, teachers, and students</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="w-full md:w-auto flex items-center gap-2 shadow-glow hover:shadow-glow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create User</span>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-200 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-shimmer"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <div className="h-8 bg-gray-200 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : users && users.items.length > 0 ? (
            <>
              <UserTable
                users={users.items}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onView={openViewModal}
                currentUserId={user?.id}
              />
              
              {/* Pagination */}
              {users.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-300 text-center sm:text-left">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, users.total)} of {users.total} users
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
                          {Array.from({ length: Math.min(5, users.pages) }, (_, i) => {
                            let pageNum;
                            if (users.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= users.pages - 2) {
                              pageNum = users.pages - 4 + i;
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
                          Page {currentPage} of {users.pages}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(users.pages, prev + 1))}
                          disabled={currentPage === users.pages}
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
              <p className="text-gray-300 text-lg">No users found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || roleFilter ? 'Try adjusting your filters' : 'Create your first user'}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
      {isCreateModalOpen && (
        <UserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          mode="create"
        />
      )}

      {isStudentRegistrationModalOpen && (
        <StudentRegistrationModal
          isOpen={isStudentRegistrationModalOpen}
          onClose={() => setIsStudentRegistrationModalOpen(false)}
          onSubmit={handleStudentRegistration}
          classes={classes}
          email={studentRegistrationEmail}
        />
      )}

      {isStudentViewModalOpen && selectedUser && selectedUser.role === UserRole.STUDENT && (
        <StudentViewModal
          isOpen={isStudentViewModalOpen}
          onClose={() => {
            setIsStudentViewModalOpen(false);
            setSelectedUser(null);
          }}
          student={selectedUser}
        />
      )}

      {isStudentEditModalOpen && selectedUser && selectedUser.role === UserRole.STUDENT && (
        <StudentEditModal
          isOpen={isStudentEditModalOpen}
          onClose={() => {
            setIsStudentEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh users list after editing
          }}
          student={selectedUser}
          classes={classes}
        />
      )}

      {isEditModalOpen && selectedUser && selectedUser.role !== UserRole.STUDENT && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={(data) => handleUpdate(selectedUser.id, data)}
          mode="edit"
          user={selectedUser}
        />
      )}

      {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDelete}
          userName={selectedUser.full_name || selectedUser.email}
        />
      )}
      </div>
    </DashboardLayout>
  );
}

/**
 * `useSearchParams` (used for the `?role=` filter) opts the page out of static
 * prerendering unless it sits under a Suspense boundary, which fails the
 * production build. The boundary shows the same skeleton the page uses while
 * it resolves its own auth state, so nothing changes visually.
 */
export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <SkeletonDashboard />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
