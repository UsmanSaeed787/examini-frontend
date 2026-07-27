'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import SectionModal from '@/components/sections/section-modal';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface Section {
  id: string;
  name: string;
  description?: string | null;
  class_id?: string;
  created_at?: string;
}

interface Class {
  id: string;
  name: string;
  description?: string | null;
}

export default function SectionsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

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
      fetchSections();
    }
  }, [isAuthenticated, user]);

  const fetchClasses = async () => {
    try {
      const data = await adminApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSections(selectedClassId || undefined);
      // Backend returns List[SectionResponse], so data is already an array
      setSections(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load sections');
      console.error('Sections error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchSections();
    }
  }, [selectedClassId]);

  const handleCreate = async (sectionData: { name: string; description?: string | null }) => {
    if (!selectedClassId) {
      toast.error('Please select a class first');
      return;
    }
    try {
      await adminApi.createSection(selectedClassId, sectionData);
      toast.success('Section created successfully');
      setIsCreateModalOpen(false);
      setSelectedClassId(''); // Reset selection
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create section');
      throw error;
    }
  };

  const handleUpdate = async (sectionData: { name: string; description?: string | null }) => {
    if (!selectedSection) return;
    try {
      await adminApi.updateSection(selectedSection.id, sectionData);
      toast.success('Section updated successfully');
      setIsEditModalOpen(false);
      setSelectedSection(null);
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update section');
      throw error;
    }
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await adminApi.deleteSection(sectionId);
      toast.success('Section deleted successfully');
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete section');
    }
  };

  const filteredSections = sections.filter((section) =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Section Management</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Manage sections for classes</p>
          </div>
          <Button 
            variant="primary" 
            className="w-full md:w-auto"
            onClick={() => {
              if (classes.length === 0) {
                toast.error('Please create a class first');
                router.push('/classes');
                return;
              }
              if (!selectedClassId) {
                toast.error('Please select a class first');
                return;
              }
              setIsCreateModalOpen(true);
            }}
          >
            + Create Section
          </Button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Class (Optional)</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white bg-gray-800"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="hidden md:block">
                <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-700 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-700 last:border-0">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-full animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-700 rounded w-24 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-4 animate-shimmer"></div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-base sm:text-lg font-medium mb-2 text-white">No sections yet</p>
              <p className="text-sm mb-4">
                {searchTerm || selectedClassId ? 'No sections match your search' : 'Create your first section to get started'}
              </p>
              {!searchTerm && !selectedClassId && classes.length > 0 && (
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Section
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
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-300">Class</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSections.map((section) => {
                      const sectionClass = classes.find(c => c.id === section.class_id);
                      return (
                        <tr key={section.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                          <td className="py-3 px-4 text-sm font-medium text-white">{section.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-400">{section.description || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-400">{sectionClass?.name || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSection(section);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(section.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredSections.map((section) => {
                  const sectionClass = classes.find(c => c.id === section.class_id);
                  return (
                    <div key={section.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg">
                      <div className="mb-3">
                        <h3 className="text-base font-semibold text-white mb-1">{section.name}</h3>
                        {section.description && (
                          <p className="text-sm text-gray-400 mb-2">{section.description}</p>
                        )}
                        {sectionClass && (
                          <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary-500/20 text-primary-400 text-xs font-medium border border-primary-500/30">
                            {sectionClass.name}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedSection(section);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(section.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        {isCreateModalOpen && selectedClassId && (
          <SectionModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
            }}
            onSubmit={handleCreate}
            mode="create"
            classId={selectedClassId}
          />
        )}

        {isEditModalOpen && selectedSection && (
          <SectionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedSection(null);
            }}
            onSubmit={handleUpdate}
            mode="edit"
            sectionData={selectedSection}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
