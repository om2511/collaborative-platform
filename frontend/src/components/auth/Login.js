import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { EyeIcon, EyeSlashIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useIsMobile, useIsTablet } from '../../hooks/useMediaQuery';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login({ ...formData, rememberMe });
    
    if (result.success) {
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow delay-1000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse-slow delay-500"></div>
      </div>

      <div className="relative h-full flex">
        {/* Left side - Form */}
        <div className={`flex-1 flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8 ${isTablet ? 'max-w-none' : 'max-w-md lg:max-w-lg'}`}>
          <div className="w-full max-w-md space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <img 
                        src="/images/logo.png" 
                        alt="CollabAI Logo" 
                        className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        CollabAI
                      </h1>
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-20 -z-10"></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-600">
                  Sign in to continue your AI-powered collaboration journey
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
                  disabled={!formData.email || !formData.password}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to CollabAI?</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link 
                    to="/register" 
                    className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-200 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                  >
                    Create your account
                  </Link>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>
        </div>

        {/* Right side - Feature showcase (hidden on mobile) */}
        {!isMobile && (
          <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative flex flex-col justify-center px-8 xl:px-12 text-white">
              <div className="max-w-lg">
                <h3 className="text-3xl xl:text-4xl font-bold mb-6">
                  AI-Powered Collaboration
                </h3>
                <p className="text-lg xl:text-xl text-blue-100 mb-8">
                  Experience the future of teamwork with intelligent project management, 
                  real-time collaboration, and AI-driven insights.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                    <span className="text-blue-100">Smart task automation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                    <span className="text-blue-100">Real-time collaboration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                    <span className="text-blue-100">AI-powered insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;