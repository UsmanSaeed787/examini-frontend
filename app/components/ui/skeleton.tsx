'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = 'bg-gray-700 rounded animate-shimmer';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        !animate && 'animate-none',
        className
      )}
      style={style}
    />
  );
}

// Pre-built skeleton components
/**
 * A card-shaped placeholder. Without children it renders a generic
 * header-plus-lines body; pass children to lay out a skeleton that mirrors the
 * real card the page is waiting on.
 */
export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6', className)}>
      {children ?? (
        <>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="rectangular" width={60} height={32} />
          </div>
          <div className="space-y-3">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="80%" height={16} />
            <Skeleton variant="text" width="90%" height={16} />
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-700">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="text" height={16} />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 py-3">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} variant="text" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg bg-gray-800/50">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
          <Skeleton variant="rectangular" width={60} height={32} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar Skeleton */}
      <aside className="bg-gray-900 border-r border-gray-700 fixed h-full z-50 w-64 shadow-2xl">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={100} height={24} />
            </div>
          </div>

          {/* Navigation Skeleton */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-2 space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
                  <Skeleton variant="rectangular" width={20} height={20} />
                  <Skeleton variant="text" width={120} height={20} />
                </div>
              ))}
            </div>
          </nav>

          {/* User Profile Skeleton */}
          <div className="border-t border-gray-700 p-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width={120} height={16} />
                  <Skeleton variant="text" width={100} height={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 ml-64">
        {/* Header Skeleton */}
        <header className="bg-gray-900 border-b border-gray-700 h-14 sm:h-16 sticky top-0 z-10 shadow-md">
          <div className="h-full flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Skeleton variant="rectangular" width={24} height={24} />
              <Skeleton variant="text" width={150} height={24} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="text" width={120} height={16} />
            </div>
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="p-4 sm:p-6 bg-gray-900 min-h-screen">
          <div className="space-y-4 sm:space-y-6">
            {/* Welcome Section Skeleton */}
            <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl p-4 sm:p-6 border border-primary-400/20">
              <Skeleton variant="text" width={250} height={32} className="mb-2 bg-white/20" />
              <Skeleton variant="text" width={200} height={20} className="bg-white/20" />
            </div>

            {/* Statistics Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                  </div>
                  <div>
                    <Skeleton variant="text" width={80} height={14} className="mb-1" />
                    <Skeleton variant="text" width={60} height={32} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
              <Skeleton variant="text" width={150} height={28} className="mb-4 sm:mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 sm:p-6"
                  >
                    <Skeleton variant="rectangular" width={40} height={40} className="mb-2 sm:mb-3 bg-white/20 rounded" />
                    <Skeleton variant="text" width={120} height={20} className="mb-1 bg-white/20" />
                    <Skeleton variant="text" width={100} height={16} className="bg-white/20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
                  <Skeleton variant="text" width={150} height={24} className="mb-4" />
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <Skeleton variant="text" width={100} height={16} />
                        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

