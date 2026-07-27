'use client';

import { useEffect, useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { User, UserRole, UserCreate, UserUpdate } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot be longer than 72 characters')
    .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain at least one uppercase letter')
    .refine((pwd) => /[a-z]/.test(pwd), 'Password must contain at least one lowercase letter')
    .refine((pwd) => /[0-9]/.test(pwd), 'Password must contain at least one digit'),
  full_name: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

const userUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  full_name: z.string().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Both modes share one field map rather than a union of the two schemas: a
 * union splits `errors` into two shapes with no common keys, so `errors.role`
 * stops being addressable. The active zod schema still decides what is
 * required — this type only says what the form may hold.
 */
type UserFormValues = {
  email: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
};

/**
 * Discriminated on `mode`, because the two modes genuinely submit different
 * payloads: create must supply password and role, edit must not. A single
 * `UserCreate | UserUpdate` handler type forced every caller to accept fields
 * its endpoint cannot take.
 */
type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
} & (
  | { mode: 'create'; user?: undefined; onSubmit: (data: UserCreate) => Promise<void> }
  | { mode: 'edit'; user: User; onSubmit: (data: UserUpdate) => Promise<void> }
);

export default function UserModal(props: UserModalProps) {
  const { isOpen, onClose, mode, user } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === 'create' ? userCreateSchema : userUpdateSchema
    ) as Resolver<UserFormValues>,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setValue('email', user.email);
        setValue('full_name', user.full_name || '');
        setValue('is_active', user.is_active);
      } else {
        reset();
      }
    }
  }, [isOpen, mode, user, setValue, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // An empty name is sent as null, not "" — on edit that clears it.
      const fullName = data.full_name || null;

      // Narrowing on `props.mode` (not the destructured copy) is what ties the
      // payload to the matching handler.
      if (props.mode === 'create') {
        // The create resolver has already enforced these; re-reading them
        // through the schema recovers the non-optional types without
        // inventing a fallback password or role.
        const { email, password, role } = userCreateSchema.parse(data);
        await props.onSubmit({ email, password, role, full_name: fullName });
      } else {
        await props.onSubmit({
          email: data.email,
          full_name: fullName,
          is_active: data.is_active,
        });
      }
    } catch (error) {
      // Error is handled by parent
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
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden">
                <Image
                  src="/Examinilogo.png"
                  alt="Examini Logo"
                  width={48}
                  height={48}
                  className="object-contain p-1"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'create' ? 'Create New User' : 'Edit User'}
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
            {mode === 'create' && (
              <>
                <Input
                  label="Full Name (Optional)"
                  type="text"
                  placeholder="Enter full name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 characters with uppercase, lowercase, and number"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.TEACHER}>Teacher</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
                  )}
                </div>
              </>
            )}

            {mode === 'edit' && (
              <>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter full name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...register('is_active')}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Active User
                  </label>
                </div>
              </>
            )}

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
                {mode === 'create' ? 'Create User' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
