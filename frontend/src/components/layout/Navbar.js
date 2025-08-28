import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/api';
import {
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Function to load real notifications
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationService.getNotifications(5);
      const dashboardData = response.data.data;
      
      const realNotifications = [];
      
      // Convert recent tasks to notifications
      if (dashboardData.recentTasks && Array.isArray(dashboardData.recentTasks)) {
        dashboardData.recentTasks.slice(0, 2).forEach((task, index) => {
          realNotifications.push({
            id: `task_${task._id || index + 1}`,
            type: task.status === 'done' ? 'success' : 'info',
            message: `Task "${task.title}" was ${task.status === 'done' ? 'completed' : 'updated'}`,
            time: formatTimeAgo(task.updatedAt),
            read: false
          });
        });
      }
      
      // Convert upcoming deadlines to notifications
      if (dashboardData.upcomingDeadlines && Array.isArray(dashboardData.upcomingDeadlines)) {
        dashboardData.upcomingDeadlines.slice(0, 2).forEach((task, index) => {
          realNotifications.push({
            id: `deadline_${task._id || index + 1}`,
            type: 'warning',
            message: `Task "${task.title}" is due soon`,
            time: formatTimeAgo(task.dueDate),
            read: false
          });
        });
      }
      
      // Convert recent ideas to notifications
      if (dashboardData.recentIdeas && Array.isArray(dashboardData.recentIdeas)) {
        dashboardData.recentIdeas.slice(0, 1).forEach((idea, index) => {
          realNotifications.push({
            id: `idea_${idea._id || index + 1}`,
            type: 'info',
            message: `New idea "${idea.title}" was submitted`,
            time: formatTimeAgo(idea.createdAt),
            read: false
          });
        });
      }
      
      // If no real notifications, show a welcome message
      if (realNotifications.length === 0) {
        realNotifications.push({
          id: 'welcome',
          type: 'info',
          message: 'Welcome to CollabAI! Start creating projects and tasks to see notifications here.',
          time: 'Just now',
          read: false
        });
      }
      
      setNotifications(realNotifications.slice(0, 5));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to a basic welcome notification
      setNotifications([
        {
          id: 'fallback',
          type: 'info',
          message: 'Welcome to CollabAI!',
          time: 'Just now',
          read: false
        }
      ]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Ideas', href: '/ideas', icon: LightBulbIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Load notifications when component mounts and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section: Logo */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0">
                    <img 
                      src="/images/logo.png" 
                      alt="CollabAI" 
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg items-center justify-center hidden">
                      <span className="text-white font-bold text-lg">AI</span>
                    </div>
                  </div>
                  <div className="block">
                    <h1 className="text-xl mb-1 font-bold text-gray-900">CollabAI</h1>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex md:space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Section: Online users + Notifications + Profile */}
          <div className="flex items-center space-x-3">
            {/* Online users indicator */}
            {onlineUsers.length > 0 && (
              <div className="hidden lg:flex items-center text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1.5">
                <div className="flex -space-x-1 mr-2">
                  {onlineUsers.slice(0, 3).map((user, index) => (
                    <div
                      key={user.id}
                      className="relative h-5 w-5 rounded-full bg-gray-300 border-2 border-white hover:z-10 transition-transform hover:scale-110"
                      title={user.name}
                    >
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-white"></div>
                    </div>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="relative h-5 w-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{onlineUsers.length} online</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {isNotificationOpen && (
                <>
                  {/* Mobile dropdown - horizontally centered only */}
                  <div className="sm:hidden fixed inset-x-0 top-16 z-50 flex justify-center px-4" 
                       onClick={() => setIsNotificationOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 w-full max-w-sm max-h-[70vh] overflow-hidden mt-2"
                         onClick={(e) => e.stopPropagation()}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{notifications.length} total</span>
                            <button 
                              onClick={() => setIsNotificationOpen(false)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="text-center py-6 text-gray-500">
                              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                              <p className="text-sm">Loading notifications...</p>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'
                                } hover:bg-gray-100`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                                    notification.type === 'success' ? 'bg-green-500' :
                                    notification.type === 'warning' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-relaxed ${
                                      notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1">
                              View all notifications
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop dropdown - positioned normally */}
                  <div className="hidden sm:block absolute mt-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50" 
                       style={{
                         right: '0px',
                         width: 'min(380px, calc(100vw - 16px))',
                         minWidth: '320px',
                         maxWidth: 'calc(100vw - 16px)'
                       }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <span className="text-xs text-gray-500">{notifications.length} total</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'
                              } hover:bg-gray-100`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.type === 'success' ? 'bg-green-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-relaxed ${
                                    notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1">
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm mb-1 font-medium text-gray-900 truncate max-w-24">
                      {user?.name}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
                </div>
              </button>

              {/* Profile dropdown - Fixed spacing */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User Info Section - Compact */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1 font-medium text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs mb-1 text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items - Compact */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Profile Settings
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Account Settings
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <ShieldCheckIcon className="h-4 w-4 mr-3 text-gray-400" />
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    
                    {/* Logout - Compact */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button - moved to end */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg relative z-50">
            {/* Navigation Links */}
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={`h-5 w-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}

            {/* Online Users in Mobile - Compact */}
            {onlineUsers.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="px-3 mb-2">
                  <p className="text-xs font-medium text-gray-900">Online Team ({onlineUsers.length})</p>
                </div>
                <div className="flex flex-wrap gap-2 px-3">
                  {onlineUsers.slice(0, 6).map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-2 py-1">
                      <div className="relative h-5 w-5 rounded-full">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-white"></div>
                      </div>
                      <span className="text-xs text-gray-600 truncate max-w-16">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay for profile dropdown only (notifications have their own overlay on mobile) */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25"
          onClick={() => setIsProfileOpen(false)}
        ></div>
      )}
      
      {/* Desktop notification overlay */}
      {isNotificationOpen && (
        <div 
          className="hidden sm:block fixed inset-0 z-40 bg-black bg-opacity-25"
          onClick={() => setIsNotificationOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;