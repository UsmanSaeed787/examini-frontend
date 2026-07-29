'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';

interface DashboardStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_classes: number;
  total_exams: number;
}


export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard statistics');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? 0,
      image: '/admin_img/Totaluser.png',
      href: '/users',
    },
    {
      title: 'Teachers',
      value: stats?.total_teachers ?? 0,
      image: '/admin_img/teacher.png',
      href: '/users?role=teacher',
    },
    {
      title: 'Students',
      value: stats?.total_students ?? 0,
      image: '/admin_img/students.png',
      href: '/users?role=student',
    },
    {
      title: 'Classes',
      value: stats?.total_classes ?? 0,
      image: '/admin_img/classroom.png',
      href: '/classes',
    },
    {
      title: 'Exams',
      value: stats?.total_exams ?? 0,
      image: '/admin_img/exam.png',
      href: null as string | null,
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Create, edit, and manage user accounts',
      href: '/users',
      icon: '👥',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: 'Manage Classes',
      description: 'Create and organize classes',
      href: '/classes',
      icon: '🏫',
      color: 'from-primary-600 to-primary-700',
    },
    {
      title: 'View Teachers',
      description: 'See all registered teachers',
      href: '/users?role=teacher',
      icon: '👨‍🏫',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: 'View Students',
      description: 'See all registered students',
      href: '/users?role=student',
      icon: '👨‍🎓',
      color: 'from-primary-500 to-primary-600',
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl p-4 sm:p-6 text-white border border-primary-400/20">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Admin!</h1>
          <p className="text-sm sm:text-base text-white/90">Manage your exam system efficiently</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.href && router.push(stat.href)}
              className={`bg-gray-800 rounded-xl shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-700 ${stat.href ? 'cursor-pointer hover:shadow-xl hover:shadow-primary-500/20 transform hover:-translate-y-1' : ''}`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center justify-center">
                  <Image
                    src={stat.image}
                    alt={stat.title}
                    width={64}
                    height={64}
                    className="object-contain w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">{stat.title}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? (
                    <span className="inline-block w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className={`bg-gradient-to-r ${action.color} text-white rounded-lg p-4 sm:p-6 text-left hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{action.icon}</div>
                <h3 className="font-semibold text-base sm:text-lg mb-1">{action.title}</h3>
                <p className="text-xs sm:text-sm text-white/90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Users</h3>
            <div className="text-center py-6 sm:py-8 text-gray-400">
              <p className="text-sm sm:text-base">Recent user activity will appear here</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">System Overview</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <span className="text-sm sm:text-base text-gray-300">System Status</span>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <span className="text-sm sm:text-base text-gray-300">Database</span>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
