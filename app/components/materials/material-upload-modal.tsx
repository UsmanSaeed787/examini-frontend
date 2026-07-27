'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const materialUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  class_id: z.string().min(1, 'Class is required'),
  file: z.instanceof(File).refine(
    (file) => file.size > 0,
    'Please select a file'
  ),
});

type MaterialUploadForm = z.infer<typeof materialUploadSchema>;

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: Array<{ id: string; name: string }>;
}

export default function MaterialUploadModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
}: MaterialUploadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<MaterialUploadForm>({
    resolver: zodResolver(materialUploadSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedFile(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: MaterialUploadForm) => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', data.title);
      formData.append('class_id', data.class_id);
      if (data.description) {
        formData.append('description', data.description);
      }

      await teacherApi.uploadMaterial(formData);
      toast.success('Material uploaded successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to upload material';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file, { shouldValidate: true });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col modal-enter transform translateZ(0)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 px-6 py-5 rounded-t-2xl flex-shrink-0 border-b-2 border-primary-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-primary-600 font-bold text-xl">E</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Upload Material</h2>
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

        {/* Form */}
        <div className="flex-1 overflow-y-auto modal-scrollbar p-6 bg-gradient-to-b from-gray-50 to-white">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                {...register('class_id')}
              >
                <option value="">Select Class</option>
                {classes.length === 0 ? (
                  <option value="" disabled>No classes available. Admin must create classes first.</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                )}
              </select>
              {classes.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No classes available. Admin must create classes first.
                </p>
              )}
              {errors.class_id && (
                <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
              )}
            </div>

            <Input
              label="Title *"
              type="text"
              placeholder="e.g., Chapter 1 Notes"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white resize-none"
                rows={4}
                placeholder="Optional description..."
                {...register('description')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File *</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors duration-200 ease-out">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0l-4-4m4 4l-4-4"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, PNG, JPG, JPEG (Max 50MB)</p>
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-primary-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-900">{selectedFile.name}</p>
                      <p className="text-xs text-primary-700">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  )}
                </div>
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
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
          >
            Upload Material
          </Button>
        </div>
      </div>
    </div>
  );
}

