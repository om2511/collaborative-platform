import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import {
  BellIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: {
        projectUpdates: true,
        taskAssignments: true,
        teamInvites: true,
        systemAnnouncements: true,
        weeklyDigest: false
      },
      browser: {
        projectUpdates: true,
        taskAssignments: true,
        teamInvites: true,
        taskDeadlines: true,
        mentions: true
      }
    },
    privacy: {
      profileVisibility: 'team', // 'public', 'team', 'private'
      showEmail: false,
      showDepartment: true,
      allowDirectMessages: true
    },
    appearance: {
      theme: 'system', // 'light', 'dark', 'system'
      compactMode: false,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30, // minutes
      loginAlerts: true
    }
  });

  // Load settings (in real implementation, this would come from backend)
  useEffect(() => {
    // For now, we'll use localStorage to persist settings
    const savedSettings = localStorage.getItem(`settings_${user.id}`);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, [user.id]);

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real implementation, this would send to backend
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settings));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Update setting helper
  const updateSetting = (section, subsection, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  // Update simple setting helper
  const updateSimpleSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const sections = [
    {
      id: 'general',
      name: 'General',
      icon: CogIcon,
      description: 'Basic preferences and account settings'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      description: 'Manage how you receive notifications'
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: EyeIcon,
      description: 'Control your profile visibility and privacy'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: PaintBrushIcon,
      description: 'Customize the look and feel'
    },
    {
      id: 'security',
      name: 'Security',
      icon: ShieldCheckIcon,
      description: 'Security and authentication settings'
    }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
          Account Information
        </h3>
        <div className="bg-gradient-to-br from-blue-50/70 to-cyan-50/70 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-blue-200/50">
          <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl">
            <span className="text-sm font-medium text-gray-700">Name:</span>
            <span className="text-sm text-gray-900 font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl">
            <span className="text-sm font-medium text-gray-700">Email:</span>
            <span className="text-sm text-gray-900 font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{user.role?.replace('_', ' ')}</span>
          </div>
          <div className="pt-2 border-t border-blue-200/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/profile'}
              className="bg-white/50 border-white/50 backdrop-blur-sm hover:bg-white/70"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Language & Region
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.appearance.language}
              onChange={(e) => updateSimpleSetting('appearance', 'language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.appearance.timezone}
              onChange={(e) => updateSimpleSetting('appearance', 'timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
          Email Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/70 transition-all duration-200">
              <div>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {key === 'projectUpdates' && 'Get notified about project changes and updates'}
                  {key === 'taskAssignments' && 'Receive alerts when tasks are assigned to you'}
                  {key === 'teamInvites' && 'Be notified when you\'re invited to join teams'}
                  {key === 'systemAnnouncements' && 'Important system updates and maintenance notices'}
                  {key === 'weeklyDigest' && 'Weekly summary of your activity and progress'}
                </p>
              </div>
              <button
                onClick={() => updateSetting('notifications', 'email', key, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  value ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Browser Notifications
        </h3>
        <div className="space-y-4">
          {Object.entries(settings.notifications.browser).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/70 transition-all duration-200">
              <div>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {key === 'projectUpdates' && 'Real-time browser notifications for project changes'}
                  {key === 'taskAssignments' && 'Instant alerts for new task assignments'}
                  {key === 'teamInvites' && 'Immediate notifications for team invitations'}
                  {key === 'taskDeadlines' && 'Reminders for approaching task deadlines'}
                  {key === 'mentions' && 'Alerts when someone mentions you in discussions'}
                </p>
              </div>
              <button
                onClick={() => updateSetting('notifications', 'browser', key, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  value ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
        <div className="space-y-3">
          {[
            { value: 'public', label: 'Public', description: 'Anyone can view your profile' },
            { value: 'team', label: 'Team Only', description: 'Only team members can view your profile' },
            { value: 'private', label: 'Private', description: 'Only you can view your profile' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="profileVisibility"
                value={option.value}
                checked={settings.privacy.profileVisibility === option.value}
                onChange={(e) => updateSimpleSetting('privacy', 'profileVisibility', e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Information Visibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Show email address</span>
              <p className="text-sm text-gray-500">Allow others to see your email</p>
            </div>
            <button
              onClick={() => updateSimpleSetting('privacy', 'showEmail', !settings.privacy.showEmail)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.privacy.showEmail ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Show department</span>
              <p className="text-sm text-gray-500">Allow others to see your department</p>
            </div>
            <button
              onClick={() => updateSimpleSetting('privacy', 'showDepartment', !settings.privacy.showDepartment)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.privacy.showDepartment ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.showDepartment ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Allow direct messages</span>
              <p className="text-sm text-gray-500">Allow team members to message you directly</p>
            </div>
            <button
              onClick={() => updateSimpleSetting('privacy', 'allowDirectMessages', !settings.privacy.allowDirectMessages)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.privacy.allowDirectMessages ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.allowDirectMessages ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: 'light', label: 'Light', icon: SunIcon },
            { value: 'dark', label: 'Dark', icon: MoonIcon },
            { value: 'system', label: 'System', icon: ComputerDesktopIcon }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => updateSimpleSetting('appearance', 'theme', theme.value)}
              className={`relative p-4 rounded-lg border-2 transition-colors ${
                settings.appearance.theme === theme.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <theme.icon className={`w-8 h-8 ${
                  settings.appearance.theme === theme.value ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  settings.appearance.theme === theme.value ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {theme.label}
                </span>
              </div>
              {settings.appearance.theme === theme.value && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Compact mode</span>
              <p className="text-sm text-gray-500">Use more compact spacing throughout the interface</p>
            </div>
            <button
              onClick={() => updateSimpleSetting('appearance', 'compactMode', !settings.appearance.compactMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.appearance.compactMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <LockClosedIcon className="h-5 w-5 mr-2 text-red-600" />
          Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/30">
            <div>
              <span className="text-sm font-medium text-gray-900">Two-Factor Authentication</span>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Button
              variant={settings.security.twoFactorEnabled ? 'outline' : 'primary'}
              size="sm"
              onClick={() => updateSimpleSetting('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
            >
              {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
          Session Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout
            </label>
            <select
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSimpleSetting('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/30">
            <div>
              <span className="text-sm font-medium text-gray-900">Login alerts</span>
              <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
            </div>
            <button
              onClick={() => updateSimpleSetting('security', 'loginAlerts', !settings.security.loginAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.security.loginAlerts ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg ${
                  settings.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mb-4">
            <LoadingSpinner size="lg" className="text-blue-600" />
          </div>
          <p className="mt-3 text-gray-600 text-sm font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-0">
      {/* Header with Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <CogIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl mb-0 font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 mb-0">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-100/30 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
            
            <h3 className="text-sm font-semibold text-gray-900 mb-4 relative">Categories</h3>
            <nav className="space-y-1 relative">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                      activeSection === section.id
                        ? 'bg-blue-100/80 backdrop-blur-sm text-blue-700 border border-blue-200/50 shadow-sm'
                        : 'text-gray-700 hover:bg-white/50 hover:backdrop-blur-sm border border-transparent hover:border-gray-200/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 transition-colors duration-200 ${
                        activeSection === section.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      <div>
                        <div className="text-sm font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500 hidden sm:block mt-1">{section.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="px-6 py-4 border-b border-gray-200/50 bg-white/30 backdrop-blur-sm relative">
              <div className="flex items-center space-x-3">
                {sections.find(s => s.id === activeSection)?.icon && (
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    {React.createElement(sections.find(s => s.id === activeSection).icon, {
                      className: "h-5 w-5 text-white"
                    })}
                  </div>
                )}
                <div>
                  <h2 className="text-lg mb-0 font-semibold text-gray-900">
                    {sections.find(s => s.id === activeSection)?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mb-0">
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 relative">
              {renderCurrentSection()}
            </div>

            <div className="px-6 py-4 bg-white/30 backdrop-blur-sm border-t border-gray-200/50 flex justify-end relative">
              <Button
                variant="primary"
                onClick={saveSettings}
                icon={CheckIcon}
                iconPosition='left'
                disabled={isSaving}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;