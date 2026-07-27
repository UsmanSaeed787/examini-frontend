'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-gray-600 mb-6">
          {submitted 
            ? 'We\'ve sent a password reset link to your email. Please check your inbox and follow the instructions.'
            : 'Enter your email address and we\'ll send you a link to reset your password.'}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="text-gray-900"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Back to Login
          </Button>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

