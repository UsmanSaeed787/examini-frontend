'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface Material {
  id: string;
  name?: string;
  title?: string;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  file_size: number | null;
  class_id: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function MaterialViewPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

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
    if (isAuthenticated && user?.role === 'student' && materialId) {
      loadMaterial();
    }
  }, [isAuthenticated, user, materialId]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getMaterial(materialId);
      setMaterial(data);
      
      // Create URL for viewing the file (using view endpoint, not download)
      try {
        const blob = await studentApi.viewMaterial(materialId);
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);
      } catch (viewError) {
        console.error('Error loading file for preview:', viewError);
        // Don't show error, just disable preview
      }
    } catch (error: any) {
      console.error('Error loading material:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.error?.message || 'Failed to load material');
      router.push('/student/materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!material) return;
    
    try {
      const blob = await studentApi.downloadMaterial(materialId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_name || 'material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to download material');
    }
  };

  const getFileExtension = (fileName: string | null): string => {
    if (!fileName) return '';
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const canPreview = (fileName: string | null): boolean => {
    const ext = getFileExtension(fileName);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return <SkeletonDashboard />;
  }

  if (loading || !material) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6 p-6">
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4 animate-shimmer"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-6 animate-shimmer"></div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-700 rounded w-24 animate-shimmer"></div>
              <div className="h-10 bg-gray-700 rounded w-32 animate-shimmer"></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 bg-gray-700 rounded-full mx-auto animate-shimmer"></div>
                <div className="h-4 bg-gray-700 rounded w-32 mx-auto animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fileExt = getFileExtension(material.file_name);
  const canView = canPreview(material.file_name);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {material.name || material.title || material.file_name || 'Untitled Material'}
              </h1>
              {material.description && (
                <p className="text-gray-400 mt-1">{material.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/student/materials')}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
              >
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* File Viewer - Full Screen */}
        {loading ? (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 bg-gray-700 rounded-full mx-auto animate-shimmer"></div>
                <div className="h-4 bg-gray-700 rounded w-32 mx-auto animate-shimmer"></div>
              </div>
            </div>
          </div>
        ) : fileUrl && canView ? (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700" style={{ height: 'calc(100vh - 200px)' }}>
            {fileExt === 'pdf' ? (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0 rounded-lg bg-white"
                title={material.file_name || material.name || 'Material'}
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900 rounded-lg">
                <img
                  src={fileUrl}
                  alt={material.file_name || material.name || 'Material'}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        ) : fileUrl ? (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium text-white mb-2">
                {material.file_name || material.name || 'Material File'}
              </p>
              <p className="text-gray-400 mb-4">
                This file type cannot be previewed in the browser. Please download to view.
              </p>
              <Button
                variant="primary"
                onClick={handleDownload}
              >
                Download File
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium text-white mb-2">
                {material.file_name || material.name || 'Material File'}
              </p>
              <p className="text-gray-400 mb-4">
                Loading file preview...
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

