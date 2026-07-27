'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ClassModal from '@/components/classes/class-modal';

interface Class {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

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
    if (isAuthenticated && user?.role === 'admin') {
      fetchClasses();
    }
  }, [isAuthenticated, user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getClasses();
      // Backend returns List[ClassResponse], so data is already an array
      setClasses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load classes');
      console.error('Classes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (classData: { name: string; description?: string | null }) => {
    try {
      await adminApi.createClass(classData);
      toast.success('Class created successfully');
      setIsCreateModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create class');
      throw error;
    }
  };

  const handleUpdate = async (classData: { name: string; description?: string | null }) => {
    if (!selectedClass) return;
    try {
      await adminApi.updateClass(selectedClass.id, classData);
      toast.success('Class updated successfully');
      setIsEditModalOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update class');
      throw error;
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await adminApi.deleteClass(classId);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete class');
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!initialized || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Class Management</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Create and manage classes</p>
          </div>
          <Button 
            variant="primary" 
            className="w-full md:w-auto flex items-center gap-2 shadow-glow hover:shadow-glow-lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Class</span>
          </Button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <Input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="hidden md:block">
                <div className="bg-gray-800/50 rounded-xl shadow-sm border border-gray-700 p-6">
                  <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-700 mb-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                    ))}
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-700 last:border-0">
                      <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                      <div className="h-4 bg-gray-700 rounded w-full animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded w-24 animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-1/2 mb-2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-4 animate-shimmer"></div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🏫</div>
              <p className="text-base sm:text-lg font-medium mb-2 text-white">No classes yet</p>
              <p className="text-sm mb-4">
                {searchTerm ? 'No classes match your search' : 'Create your first class to get started'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Class
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-300">Description</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls) => (
                      <tr key={cls.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-sm font-medium text-white">{cls.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">{cls.description || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(cls);
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-1"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(cls.id)}
                              className="flex items-center gap-1"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredClasses.map((cls) => (
                  <div key={cls.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-lg card-glow hover:border-primary-500 transition-all">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-white mb-1">{cls.name}</h3>
                      {cls.description && (
                        <p className="text-sm text-gray-400">{cls.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsEditModalOpen(true);
                        }}
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={() => handleDelete(cls.id)}
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        {isCreateModalOpen && (
          <ClassModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreate}
            mode="create"
          />
        )}

        {isEditModalOpen && selectedClass && (
          <ClassModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedClass(null);
            }}
            onSubmit={handleUpdate}
            mode="edit"
            classData={selectedClass}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
