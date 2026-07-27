'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function StudentMaterialsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      if (user.role !== 'student') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      fetchMaterials();
    }
  }, [isAuthenticated, user]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getMaterials();
      setMaterials(data.items || []);
    } catch (error: any) {
      toast.error('Failed to load materials');
      console.error('Materials error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId: string, fileName: string) => {
    try {
      const blob = await studentApi.downloadMaterial(materialId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to download material');
    }
  };

  const filteredMaterials = materials.filter(material => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      material.name?.toLowerCase().includes(search) ||
      material.title?.toLowerCase().includes(search) ||
      material.description?.toLowerCase().includes(search)
    );
  });

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Class Materials</h1>
            <p className="text-gray-400 mt-1">Download and view class materials</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
            <Input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        {/* Materials Grid */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-700 rounded-xl p-4 bg-gray-800/50 animate-pulse">
                  <div className="h-12 bg-gray-700 rounded mb-3 animate-shimmer"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-4 animate-shimmer"></div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    <div className="h-9 bg-gray-700 rounded w-20 animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-300 text-lg font-medium mb-2">
                {searchTerm ? 'No materials found' : 'No materials available'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Try adjusting your search' : 'Check back later for new materials'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="border border-gray-700 rounded-xl p-4 hover:shadow-lg hover:shadow-primary-500/20 transition-all bg-gray-800/50 card-glow hover:border-primary-500">
                  <div className="text-4xl mb-3">📄</div>
                  <h3 className="font-semibold text-lg text-white mb-2">{material.name || material.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-400 mb-4">{material.description || 'No description'}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownload(material.id, material.file_name || material.title)}
                      className="flex-1"
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/student/materials/${material.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

