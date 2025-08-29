import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const UserManagement = ({ systemStats, onStatsUpdate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        sort: '-createdAt'
      };

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'role') {
      setRoleFilter(value);
    }
    setCurrentPage(1);
  };

  const handleViewUser = async (userId) => {
    try {
      setActionLoading(true);
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, isActive, reason = '') => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${userId}/status`, {
        isActive,
        reason
      });
      
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
      onStatsUpdate?.();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${userId}/role`, { role });
      
      toast.success(`User role updated to ${role} successfully`);
      loadUsers();
      onStatsUpdate?.();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, transferProjectsTo = null) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/admin/users/${userId}`, {
        data: { transferProjectsTo }
      });
      
      toast.success('User deleted successfully');
      loadUsers();
      onStatsUpdate?.();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-6 -translate-x-6"></div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:bg-white/80 w-full lg:w-80"
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:bg-white/80"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:bg-white/80"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/30">
            <thead className="bg-white/40 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-white/20">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-white/40 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full border-2 border-white/50 shadow-sm"
                            src={user.avatar}
                            alt={user.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white/50 shadow-sm">
                            <UserCircleIcon className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-3">
                      <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs border border-white/30">{user.stats.projects} projects</span>
                      <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs border border-white/30">{user.stats.tasks} tasks</span>
                      <span className="bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs border border-white/30">{user.stats.ideas} ideas</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user._id)}
                        className="p-2 text-blue-600 hover:text-blue-800 bg-white/50 hover:bg-white/70 rounded-lg border border-white/30 transition-all duration-200 backdrop-blur-sm"
                        disabled={actionLoading}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
          <div className="text-sm text-gray-700 font-medium mb-2 sm:mb-0">
            Showing page {pagination.current} of {pagination.pages} ({pagination.total} users)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 text-sm font-medium bg-white/60 hover:bg-white/80 disabled:bg-gray-200/50 disabled:text-gray-400 border border-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 text-sm font-medium bg-white/60 hover:bg-white/80 disabled:bg-gray-200/50 disabled:text-gray-400 border border-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white/50 shadow-lg">
                {selectedUser.user.avatar ? (
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={selectedUser.user.avatar}
                    alt={selectedUser.user.name}
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedUser.user.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{selectedUser.user.email}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${getRoleColor(selectedUser.user.role)}`}>
                    {selectedUser.user.role}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${getStatusColor(selectedUser.user.isActive)}`}>
                    {selectedUser.user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  {selectedUser.stats.projects}
                </div>
                <div className="text-sm text-gray-600 font-medium">Projects</div>
              </div>
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  {selectedUser.stats.tasks}
                </div>
                <div className="text-sm text-gray-600 font-medium">Tasks</div>
              </div>
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">
                  {selectedUser.stats.ideas}
                </div>
                <div className="text-sm text-gray-600 font-medium">Ideas</div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-white/30 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Administrative Actions</h4>
              <div className="space-y-4">
                {/* Status Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                  <span className="text-sm font-medium text-gray-700">Account Status</span>
                  <button
                    onClick={() => handleUpdateUserStatus(
                      selectedUser.user._id,
                      !selectedUser.user.isActive,
                      !selectedUser.user.isActive ? 'Reactivated by admin' : 'Deactivated by admin'
                    )}
                    className={`px-4 py-2 text-sm font-medium rounded-lg backdrop-blur-sm border transition-all duration-200 ${
                      selectedUser.user.isActive
                        ? 'bg-red-100/80 text-red-700 hover:bg-red-200/80 border-red-200/50'
                        : 'bg-green-100/80 text-green-700 hover:bg-green-200/80 border-green-200/50'
                    }`}
                    disabled={actionLoading}
                  >
                    {selectedUser.user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>

                {/* Role Update */}
                <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                  <span className="text-sm font-medium text-gray-700">User Role</span>
                  <select
                    value={selectedUser.user.role}
                    onChange={(e) => handleUpdateUserRole(selectedUser.user._id, e.target.value)}
                    disabled={actionLoading}
                    className="px-3 py-2 text-sm bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Delete User */}
                <div className="flex items-center justify-between pt-4 border-t border-white/30 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Delete User</span>
                    <p className="text-xs text-gray-600">Permanently delete this user account</p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.user._id)}
                    className="px-4 py-2 text-sm font-medium bg-red-100/80 text-red-700 hover:bg-red-200/80 border border-red-200/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
                    disabled={actionLoading}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;