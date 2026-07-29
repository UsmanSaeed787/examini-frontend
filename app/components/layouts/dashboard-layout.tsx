'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import UserDropdown from '@/components/users/user-dropdown';
import LogoutConfirmationModal from '@/components/users/logout-confirmation-modal';
import LoggingOutModal from '@/components/user/logging-out-modal';
import UserProfileModal from '@/components/users/user-profile-modal';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'teacher' | 'student';
}

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Users', href: '/users', icon: <UsersIcon /> },
  { name: 'Classes', href: '/classes', icon: <ClassesIcon /> },
  { name: 'Sections', href: '/sections', icon: <ClassesIcon /> },
  { name: 'Exams', href: '/exams', icon: <ExamsIcon /> },
];

const teacherNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Students', href: '/teacher/students', icon: <StudentsIcon /> },
  { name: 'Exams', href: '/teacher/exams', icon: <ExamsIcon /> },
  { name: 'Guided Assessments', href: '/teacher/assessments', icon: <AiAssessmentsIcon /> },
  { name: 'Results', href: '/teacher/results', icon: <ResultsIcon /> },
  { name: 'Materials', href: '/teacher/materials', icon: <MaterialsIcon /> },
];

const studentNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Exams', href: '/student/exams', icon: <ExamsIcon /> },
  { name: 'Results', href: '/student/results', icon: <ResultsIcon /> },
  { name: 'Materials', href: '/student/materials', icon: <MaterialsIcon /> },
];

function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClassesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ExamsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function AiAssessmentsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function MaterialsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const userSectionRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Keep sidebar open by default on desktop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only auto-open on desktop (lg and above)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    }
  }, []);

  const navItems = role === 'admin' ? adminNavItems : role === 'teacher' ? teacherNavItems : studentNavItems;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const handleUserSectionClick = () => {
    if (userSectionRef.current) {
      const rect = userSectionRef.current.getBoundingClientRect();
      // Position dropdown professionally - aligned to sidebar edge
      // Calculate if sidebar is open (256px) or closed (80px)
      const sidebarWidth = sidebarOpen ? 256 : 80;
      const dropdownLeft = sidebarWidth + 16; // Position after sidebar with gap
      
      // Calculate dropdown dimensions
      const dropdownHeight = 150; // Header + 2 items + padding
      const dropdownWidth = 240;
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const minMarginFromBottom = 24;
      const minMarginFromTop = 16;
      const minMarginFromRight = 16;
      
      // Calculate available space
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Determine top position - prioritize showing dropdown fully
      let dropdownTop;
      if (spaceBelow >= dropdownHeight + minMarginFromBottom) {
        // Enough space below - align with top of user section
        dropdownTop = rect.top;
      } else if (spaceAbove >= dropdownHeight + minMarginFromTop) {
        // Not enough space below, but enough above - position above user section
        dropdownTop = rect.top - dropdownHeight - 8;
      } else {
        // Not enough space in either direction - position to fit in viewport
        dropdownTop = Math.max(
          minMarginFromTop,
          Math.min(windowHeight - dropdownHeight - minMarginFromBottom, rect.top)
        );
      }
      
      // Ensure dropdown doesn't go off screen to the right
      const maxLeft = windowWidth - dropdownWidth - minMarginFromRight;
      const finalLeft = Math.min(dropdownLeft, maxLeft);
      
      setDropdownPosition({
        top: dropdownTop,
        left: finalLeft,
      });
      setUserDropdownOpen(!userDropdownOpen);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    
    try {
      await handleLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
    // Note: handleLogout will redirect to /login, so we don't need to hide modal here
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ease-out ${
          mobileMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        style={{
          transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Sidebar */}
      <aside
        className={`bg-gray-900 border-r border-gray-700 fixed h-full z-50 sidebar-container shadow-2xl w-64 ${
          // Mobile: Use class for smooth transform
          mobileMenuOpen ? 'mobile-open' : ''
        } ${
          // Desktop: Always visible, width changes based on sidebarOpen
          sidebarOpen ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
                <Image
                  src="/Examinilogo.png"
                  alt="Examini Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className={`text-xl font-bold text-white sidebar-text ${
                (mobileMenuOpen || sidebarOpen) ? 'sidebar-text-visible' : 'sidebar-text-hidden'
              }`}>
                Examini
              </h1>
            </div>
            {/* Close button for mobile - only show when mobile menu is open */}
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      // Close mobile menu when navigating
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white font-semibold shadow-lg shadow-primary-600/50'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className={`sidebar-text ${
                      (mobileMenuOpen || sidebarOpen) ? 'sidebar-text-visible' : 'sidebar-text-hidden'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-700 p-4">
            {user && (
              <div 
                ref={userSectionRef}
                onClick={handleUserSectionClick}
                className={`mb-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200 ease-out ${
                  (mobileMenuOpen || sidebarOpen) ? 'p-3 bg-gray-800/50' : 'p-2'
                }`}
              >
                <div className={`flex items-center transition-all duration-200 ease-out ${
                  (mobileMenuOpen || sidebarOpen) ? 'gap-3' : 'justify-center'
                }`} style={{ minHeight: '2.5rem' }}>
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.full_name || user.email}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover hover:ring-2 hover:ring-primary-200 transition-all"
                      style={{ minWidth: '2.5rem', minHeight: '2.5rem', maxWidth: '2.5rem', maxHeight: '2.5rem' }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 hover:bg-primary-200 transition-colors" style={{ minWidth: '2.5rem', minHeight: '2.5rem', maxWidth: '2.5rem', maxHeight: '2.5rem' }}>
                      <span className="text-primary-600 font-semibold text-sm">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 sidebar-text ${
                    (mobileMenuOpen || sidebarOpen) ? 'sidebar-text-visible' : 'sidebar-text-hidden'
                  }`}>
                    <p className="text-sm font-medium text-white truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 sidebar-text ${
                    (mobileMenuOpen || sidebarOpen) ? 'sidebar-text-visible' : 'sidebar-text-hidden'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 main-content-wrapper ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0`}>
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-700 h-14 sm:h-16 sticky top-0 z-10 shadow-md">
          <div className="h-full flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Hamburger menu - shown on all screen sizes, positioned before page title */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileMenuOpen(!mobileMenuOpen);
                  } else {
                    setSidebarOpen(!sidebarOpen);
                  }
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                aria-label="Toggle menu"
              >
                <svg 
                  className="w-7 h-7 sm:w-8 sm:h-8 text-white rotate-90" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="2" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                  />
                  <path 
                    d="M21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">
                {navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user && (
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-white">
                    Welcome, {user.full_name || user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 bg-gray-900 min-h-screen">{children}</main>
      </div>

      {/* User Dropdown */}
      {user && (
        <UserDropdown
          isOpen={userDropdownOpen}
          onClose={() => setUserDropdownOpen(false)}
          user={user}
          onViewProfile={() => setShowProfileModal(true)}
          onLogout={handleLogoutClick}
          position={dropdownPosition}
        />
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Logging Out Progress Modal */}
      <LoggingOutModal isOpen={isLoggingOut} />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
}

