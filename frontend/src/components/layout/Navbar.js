import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/api';
import { useIsMobile } from '../../hooks/useMediaQuery';
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
  const isMobile = useIsMobile();

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
            time: new Date(task.updatedAt || Date.now()).toLocaleTimeString(),
            read: false
          });
        });
      }
      
      // Add fallback notifications if no real data
      if (realNotifications.length === 0) {
        realNotifications.push(
          {
            id: 1,
            type: 'success',
            message: 'Welcome to your dashboard!',
            time: '2 min ago',
            read: false
          },
          {
            id: 2,
            type: 'info', 
            message: 'System is running optimally',
            time: '5 min ago',
            read: false
          }
        );
      }
      
      setNotifications(realNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback notifications on error
      setNotifications([
        {
          id: 1,
          type: 'success',
          message: 'Welcome to your dashboard!',
          time: '2 min ago',
          read: false
        }
      ]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => 
      notif.read === false ? { ...notif, read: true } : notif
    ));
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
    <nav className="bg-white/70 backdrop-blur-xl shadow-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section: Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo with Glass Effect */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center group">
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0 relative">
                    <img 
                      src="/images/logo.png" 
                      alt="CollabAI Logo" 
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl mt-2 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      CollabAI
                    </h1>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation with Glass Effect */}
            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                    {item.name}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Notifications & Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications with Glass Effect */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl hover:bg-blue-50/50 transition-all duration-200"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg min-w-[18px] h-[18px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown with Glass Effect */}
              {isNotificationOpen && (
                <>
                  {/* Mobile dropdown - horizontally centered */}
                  {isMobile ? (
                    <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4" 
                         onClick={() => setIsNotificationOpen(false)}>
                      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 w-full max-w-sm max-h-[70vh] overflow-hidden mt-2"
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
                                  onClick={() => markAsRead(notification.id)}
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
                  ) : (
                    /* Desktop dropdown - positioned normally */
                    <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 z-50">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                          ) : notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                  notification.read 
                                    ? 'bg-gray-50/50 hover:bg-gray-100/50' 
                                    : 'bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/50'
                                }`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex items-start">
                                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                                    notification.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                                  }`}></div>
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm text-gray-900">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Profile Dropdown with Glass Effect */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="h-8 w-8 rounded-xl object-cover ring-2 ring-white/50 shadow-sm"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm mt-3 font-medium text-gray-900 truncate max-w-24">
                      {user?.name}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
                </div>
              </button>

              {/* Profile dropdown with Glass Effect */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 z-50">
                  <div className="py-2">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100/50">
                      <div className="flex items-center space-x-3">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-10 w-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl mx-2"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCircleIcon className="h-4 w-4 mr-3" />
                        Your Profile
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl mx-2"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-3" />
                        Settings
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl mx-2"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <ShieldCheckIcon className="h-4 w-4 mr-3" />
                          Admin Panel
                        </Link>
                      )}

                      <hr className="my-2 mx-4 border-gray-100" />
                      
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors duration-200 rounded-xl mx-2"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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

      {/* Mobile menu with Glass Effect */}
      {isMobileMenuOpen && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-xl border-t border-white/20">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay for dropdowns */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsProfileOpen(false)}
        ></div>
      )}
      
      {/* Desktop notification overlay */}
      {isNotificationOpen && !isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={() => setIsNotificationOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;