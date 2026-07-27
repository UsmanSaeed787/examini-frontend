'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

const materialEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

type MaterialEditForm = z.infer<typeof materialEditSchema>;

interface MaterialEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material: {
    id: string;
    title: string;
    description?: string | null;
  } | null;
}

export default function MaterialEditModal({
  isOpen,
  onClose,
  onSuccess,
  material,
}: MaterialEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaterialEditForm>({
    resolver: zodResolver(materialEditSchema),
  });

  useEffect(() => {
    if (isOpen && material) {
      reset({
        title: material.title,
        description: material.description || '',
      });
    }
  }, [isOpen, material, reset]);

  if (!isOpen || !material) return null;

  const onFormSubmit = async (data: MaterialEditForm) => {
    setIsSubmitting(true);
    try {
      await teacherApi.updateMaterial(material.id, {
        title: data.title,
        description: data.description || undefined,
      });
      toast.success('Material updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
            : error.response.data.detail)
        : error.response?.data?.error?.message || 'Failed to update material';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              <h2 className="text-2xl font-bold text-white">Edit Material</h2>
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
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

