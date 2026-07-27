'use client';

import { User, UserRole } from '@/types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView?: (user: User) => void;
  currentUserId?: string;
}

export default function UserTable({ users, onEdit, onDelete, onView, currentUserId }: UserTableProps) {
  const canEditOrDelete = (user: User) => {
    // Admin users cannot be edited or deleted
    if (user.role === UserRole.ADMIN) {
      return false;
    }
    return true;
  };
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.TEACHER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.STUDENT:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/50 divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.profile_image_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.profile_image_url}
                          alt={user.full_name || user.email}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {user.profile?.full_name_matric || user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      {user.profile && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.profile.father_name && `Father: ${user.profile.father_name}`}
                          {user.enrollments && user.enrollments.length > 0 && user.enrollments[0].roll_number && (
                            <span className="ml-2">Roll: {user.enrollments[0].roll_number}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {user.role === UserRole.STUDENT && onView && (
                      <button
                        onClick={() => onView(user)}
                        className="text-primary-400 hover:text-primary-300 px-3 py-1 rounded hover:bg-primary-500/20 transition-colors"
                      >
                        View
                      </button>
                    )}
                    {canEditOrDelete(user) ? (
                      <>
                        <button
                          onClick={() => onEdit(user)}
                          className="text-primary-400 hover:text-primary-300 px-3 py-1 rounded hover:bg-primary-500/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Protected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-800 rounded-lg border border-gray-700 p-5 sm:p-6 shadow-lg mx-2 sm:mx-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="shrink-0">
                  {user.profile_image_url ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={user.profile_image_url}
                      alt={user.full_name || user.email}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                      <span className="text-primary-400 font-semibold text-lg">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user.profile?.full_name_matric || user.full_name || 'No name'}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-1">{user.email}</div>
                  {user.profile && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {user.profile.father_name && `Father: ${user.profile.father_name}`}
                      {user.enrollments && user.enrollments.length > 0 && user.enrollments[0].roll_number && (
                        <span className="ml-2">Roll: {user.enrollments[0].roll_number}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="text-xs text-gray-400 mb-3">
              Created: {formatDate(user.created_at)}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-700">
              {user.role === UserRole.STUDENT && onView && (
                <button
                  onClick={() => onView(user)}
                  className="flex-1 text-primary-400 hover:text-primary-300 px-3 py-2 rounded hover:bg-primary-500/20 transition-colors text-sm font-medium border border-primary-500"
                >
                  View
                </button>
              )}
              {canEditOrDelete(user) ? (
                <>
                  <button
                    onClick={() => onEdit(user)}
                    className="flex-1 text-primary-400 hover:text-primary-300 px-3 py-2 rounded hover:bg-primary-500/20 transition-colors text-sm font-medium border border-primary-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="flex-1 text-red-400 hover:text-red-300 px-3 py-2 rounded hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <span className="w-full text-center text-gray-500 text-xs italic py-2">Protected</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

