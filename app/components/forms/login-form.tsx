"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { API_BASE_URL } from "@/lib/constants";
import { toast } from "react-hot-toast";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleQuickFillAdmin = () => {
    setValue("email", "admin@examini.com");
    setValue("password", "Admin@123");
    toast.success("Admin credentials auto-filled!");
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    clearError();

    try {
      await login(data.email, data.password);
      toast.success("Login successful!");

      const userStr =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (userStr) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (!err.response) {
        toast.error(`Cannot connect to backend (${API_BASE_URL}). Please verify NEXT_PUBLIC_API_URL and CORS settings.`, {
          duration: 5000,
        });
      } else {
        toast.error(err.response?.data?.error?.message || "Login failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl p-8 sm:p-10">
        {/* Subtle decorative glow */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl"
          aria-hidden="true"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
            autoFocus
            {...register("email")}
          />

          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              autoComplete="current-password"
              {...register("password")}
            />
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm p-4 text-red-300 shadow-lg shadow-red-500/10"
              role="alert"
              aria-live="polite"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mt-0.5 shrink-0 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.335-.213 2.991-1.742 2.991H3.48c-1.53 0-2.492-1.656-1.743-2.99L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            isLoading={isSubmitting || isLoading}
          >
            Sign In
          </Button>
        </form>



        {/* Admin Credentials Box */}
        <div className="mt-8 pt-6 border-t border-gray-700/80">
          <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                🔑 Admin Account
              </span>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-xs font-medium text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
              >
                Auto-fill
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-300 font-mono">
              <p><span className="text-gray-500">Email:</span> admin@examini.com</p>
              <p><span className="text-gray-500">Password:</span> Admin@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
