'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import MaterialUploadModal from '@/components/materials/material-upload-modal';
import MaterialEditModal from '@/components/materials/material-edit-modal';
import DeleteConfirmModal from '@/components/users/delete-confirm-modal';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface Material {
  id: string;
  title: string;
  description?: string | null;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at: string;
  class_id: string;
}

interface PaginatedMaterials {
  items: Material[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function TeacherMaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [materials, setMaterials] = useState<PaginatedMaterials | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
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
    const action = searchParams.get('action');
    if (action === 'upload') {
      setIsUploadModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      fetchClasses();
      fetchMaterials();
    }
  }, [isAuthenticated, user, currentPage, selectedClassId]);

  const fetchClasses = async () => {
    try {
      const data = await teacherApi.getClasses();
      console.log('Classes received:', data);
      // Classes come from admin-created classes table
      setClasses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load classes - full error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to load classes');
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getMaterials(
        selectedClassId || undefined,
        currentPage,
        limit,
        searchTerm || undefined
      );
      setMaterials(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setTimeout(() => fetchMaterials(), 300);
  };

  const handleDownload = async (materialId: string, fileName: string) => {
    try {
      const blob = await teacherApi.downloadMaterial(materialId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Failed to download material');
    }
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMaterial) return;
    
    try {
      await teacherApi.deleteMaterial(selectedMaterial.id);
      toast.success('Material deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete material');
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'Unknown';
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Class Materials</h1>
            <p className="text-gray-400 mt-1">Upload and manage class materials</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 shadow-glow hover:shadow-glow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Material</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search materials..."
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

        {/* Materials Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-700 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-700 last:border-0">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-700 rounded w-24 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2 animate-shimmer"></div>
                    <div className="flex gap-2 text-xs mb-3">
                      <div className="h-3 bg-gray-700 rounded w-16 animate-shimmer"></div>
                      <div className="h-3 bg-gray-700 rounded w-12 animate-shimmer"></div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : materials && materials.items.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type / Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {materials.items.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{material.title}</div>
                          {material.description && (
                            <div className="text-sm text-gray-400 mt-1 truncate max-w-xs">
                              {material.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">{material.file_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {getClassName(material.class_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div>{material.file_type?.toUpperCase() || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{formatFileSize(material.file_size)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(material.uploaded_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDownload(material.id, material.file_name)}
                              className="text-primary-400 hover:text-primary-300 px-3 py-1 rounded hover:bg-primary-500/20 transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleEdit(material)}
                              className="text-primary-400 hover:text-primary-300 px-3 py-1 rounded hover:bg-primary-500/20 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(material)}
                              className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {materials.items.map((material) => (
                  <div key={material.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-5 shadow-sm">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-white">{material.title}</h3>
                      {material.description && (
                        <p className="text-xs text-gray-400 mt-1">{material.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 truncate">{material.file_name}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-400">
                      <span>Class: {getClassName(material.class_id)}</span>
                      <span>•</span>
                      <span>{material.file_type?.toUpperCase() || 'N/A'}</span>
                      <span>•</span>
                      <span>{formatFileSize(material.file_size)}</span>
                    </div>

                    <div className="text-xs text-gray-400 mb-3">
                      Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => handleDownload(material.id, material.file_name)}
                        className="flex-1 text-primary-400 hover:text-primary-300 px-3 py-2 rounded hover:bg-primary-500/20 transition-colors text-sm font-medium border border-primary-500/30"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleEdit(material)}
                        className="flex-1 text-primary-400 hover:text-primary-300 px-3 py-2 rounded hover:bg-primary-500/20 transition-colors text-sm font-medium border border-primary-500/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(material)}
                        className="flex-1 text-red-400 hover:text-red-300 px-3 py-2 rounded hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {materials.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-300 text-center sm:text-left">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, materials.total)} of {materials.total} materials
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
                          {Array.from({ length: Math.min(5, materials.pages) }, (_, i) => {
                            let pageNum;
                            if (materials.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= materials.pages - 2) {
                              pageNum = materials.pages - 4 + i;
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
                          Page {currentPage} of {materials.pages}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(materials.pages, prev + 1))}
                          disabled={currentPage === materials.pages}
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
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-300 text-lg">No materials yet</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || selectedClassId ? 'Try adjusting your filters' : 'Upload your first material to get started'}
              </p>
              {!searchTerm && !selectedClassId && (
                <Button
                  variant="primary"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-4"
                >
                  Upload Material
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {isUploadModalOpen && (
          <MaterialUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={fetchMaterials}
            classes={classes}
          />
        )}

        {isEditModalOpen && selectedMaterial && (
          <MaterialEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedMaterial(null);
            }}
            onSuccess={fetchMaterials}
            material={selectedMaterial}
          />
        )}

        {isDeleteModalOpen && selectedMaterial && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedMaterial(null);
            }}
            onConfirm={confirmDelete}
            userName={selectedMaterial.title}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * This page reads a query parameter with `useSearchParams`, which requires a
 * Suspense boundary or the production build cannot prerender it.
 */
export default function TeacherMaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <SkeletonDashboard />
        </div>
      }
    >
      <TeacherMaterialsContent />
    </Suspense>
  );
}
