import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  KeyIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    department: '',
    skills: [],
    avatar: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Skills input state
  const [skillInput, setSkillInput] = useState('');

  // Load profile data
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getProfile();
      const userData = response.data.data.user;
      
      setProfile(userData);
      setProfileForm({
        name: userData.name || '',
        bio: userData.bio || '',
        department: userData.department || '',
        skills: userData.skills || [],
        avatar: userData.avatar || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle profile form changes
  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle skill addition
  const addSkill = () => {
    if (skillInput.trim() && !profileForm.skills.includes(skillInput.trim())) {
      setProfileForm(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  // Handle skill removal
  const removeSkill = (skillToRemove) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await authService.updateProfile(profileForm);
      
      setProfile(response.data.data.user);
      setIsEditing(false);
      
      // Update auth context with new user data
      const updatedUser = { ...user, ...response.data.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setProfileForm({
      name: profile.name || '',
      bio: profile.bio || '',
      department: profile.department || '',
      skills: profile.skills || [],
      avatar: profile.avatar || ''
    });
    setIsEditing(false);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-4">
            <LoadingSpinner size="lg" className="text-blue-600" />
          </div>
          <p className="mt-3 text-gray-600 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 w-full max-w-6xl mx-auto px-2 sm:px-0">
        {/* Profile Header with Glass Effect */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-24 sm:h-32 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        </div>
        
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="relative -mt-12 sm:-mt-16">
            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/70 backdrop-blur-sm bg-gradient-to-br from-white/80 to-white/60 flex items-center justify-center overflow-hidden shadow-xl">
                {profile?.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                )}
              </div>
              
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
                  <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            
            {/* Name and Role */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  {profile?.name}
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100/80 backdrop-blur-sm text-blue-700 border border-blue-200/50 shadow-sm">
                    {profile?.role?.replace('_', ' ')}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
                    Member since {new Date(profile?.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={PencilIcon}
                      iconPosition='left'
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={KeyIcon}
                      iconPosition='left'
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0"
                    >
                      Change Password
                    </Button>
                  </>
                )}
                
                {isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XMarkIcon}
                      iconPosition='left'
                      onClick={handleCancelEdit}
                      className="w-full sm:w-auto bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={isSaving ? LoadingSpinner : CheckIcon}
                      iconPosition='left'
                      onClick={handleProfileSubmit}
                      disabled={isSaving}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25 border-0"
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center relative">
            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </h2>
          
          <div className="space-y-4 relative">
            {/* Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200/50">
                  {profile?.name || 'Not specified'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <div className="relative">
                <p className="text-sm text-gray-700 bg-gray-100/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200/50">
                  {profile?.email}
                </p>
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                Department
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your department"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200/50">
                  {profile?.department || 'Not specified'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">About Me</label>
              {isEditing ? (
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
              ) : (
                <p className="text-sm text-gray-900 bg-white/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200/50 min-h-[100px] leading-relaxed">
                  {profile?.bio || 'No bio provided yet. Add one to let others know more about you!'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Projects */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-100/30 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
            
            <div className="flex items-center justify-between mb-4 relative">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Skills & Expertise
              </h2>
            </div>
            
            {isEditing && (
              <div className="mb-4 relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Add a skill (e.g., React, Python, Design)..."
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addSkill}
                    disabled={!skillInput.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg border-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 relative">
              {profileForm.skills?.length > 0 ? (
                profileForm.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-indigo-100/80 backdrop-blur-sm text-indigo-700 border border-indigo-200/50 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <div className="text-center py-8 w-full">
                  <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No skills added yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isEditing ? 'Add your first skill above' : 'Edit profile to add skills'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Project Statistics */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center relative">
              <ChartBarIcon className="h-5 w-5 mr-2 text-emerald-600" />
              Statistics & Activity
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 relative">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50/70 to-cyan-50/70 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-300">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {profile?.projects?.length || 0}
                </div>
                <div className="text-xs text-blue-600 font-medium">Total Projects</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50/70 to-green-50/70 backdrop-blur-sm rounded-xl border border-emerald-200/50 hover:shadow-md transition-all duration-300">
                <div className="text-3xl font-bold text-emerald-600 mb-1 capitalize">
                  {profile?.role === 'admin' ? 'Admin' : profile?.role?.replace('_', ' ') || 'Member'}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Role</div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-200/50 relative">
              <div className="flex items-center justify-between text-sm p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">Account Created:</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {new Date(profile?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">Last Login:</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {profile?.lastLogin ? 
                    new Date(profile.lastLogin).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <KeyIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                </div>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-xl transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                      required
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                      required
                      minLength={6}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm transition-all duration-200"
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1 bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={isSaving ? LoadingSpinner : KeyIcon}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg border-0"
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;