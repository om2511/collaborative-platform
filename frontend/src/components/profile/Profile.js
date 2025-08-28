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
  KeyIcon
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
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-24 sm:h-32"></div>
        
        <div className="px-4 sm:px-6 pb-6">
          <div className="relative -mt-12 sm:-mt-16">
            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-lg">
                {profile?.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                )}
              </div>
              
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                  <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            
            {/* Name and Role */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {profile?.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 capitalize">
                  {profile?.role?.replace('_', ' ')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Member since {new Date(profile?.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
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
                      className="w-full sm:w-auto"
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={KeyIcon}
                      iconPosition='left'
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full sm:w-auto"
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
                      className="w-full sm:w-auto"
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
                      className="w-full sm:w-auto"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          
          <div className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
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
              <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                {profile?.email} <span className="text-xs">(Cannot be changed)</span>
              </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your department"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[80px]">
                  {profile?.bio || 'No bio provided'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Projects */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 text-gray-400" />
                Skills
              </h2>
            </div>
            
            {isEditing && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Add a skill..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    disabled={!skillInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {profileForm.skills?.length > 0 ? (
                profileForm.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Project Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {profile?.projects?.length || 0}
                </div>
                <div className="text-xs text-blue-600">Total Projects</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {profile?.role === 'admin' ? 'Admin' : profile?.role?.replace('_', ' ')}
                </div>
                <div className="text-xs text-green-600">Role</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Login:</span>
                <span className="text-gray-900">
                  {profile?.lastLogin ? 
                    new Date(profile.lastLogin).toLocaleDateString() : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? <LoadingSpinner size="sm" /> : 'Change Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;