'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
});

type ClassForm = z.infer<typeof classSchema>;

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string | null }) => Promise<void>;
  mode: 'create' | 'edit';
  classData?: { id: string; name: string; description?: string | null };
}

export default function ClassModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  classData,
}: ClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && classData) {
        setValue('name', classData.name);
        setValue('description', classData.description || '');
      } else {
        reset();
      }
    }
  }, [isOpen, mode, classData, setValue, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: ClassForm) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        name: data.name,
        description: data.description || null,
      };
      await onSubmit(submitData);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-enter transform translateZ(0)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 px-6 py-5 rounded-t-2xl border-b-2 border-primary-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-primary-600 font-bold text-xl">E</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'create' ? 'Create New Class' : 'Edit Class'}
              </h2>
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
        <div className="p-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <Input
              label="Class Name"
              type="text"
              placeholder="e.g., Grade 10, Class A"
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Enter class description..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
              >
                {mode === 'create' ? 'Create Class' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

