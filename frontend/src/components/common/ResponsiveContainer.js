import React from 'react';

const ResponsiveContainer = ({ 
  children, 
  className = '',
  maxWidth = '7xl',
  padding = 'responsive' // 'none', 'sm', 'md', 'lg', 'responsive'
}) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  const paddingClasses = {
    'none': '',
    'sm': 'px-2 py-2',
    'md': 'px-4 py-4',
    'lg': 'px-6 py-6',
    'responsive': 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Pre-configured container components
export const PageContainer = ({ children, className = '' }) => (
  <ResponsiveContainer maxWidth="7xl" padding="responsive" className={className}>
    {children}
  </ResponsiveContainer>
);

export const ContentContainer = ({ children, className = '' }) => (
  <ResponsiveContainer maxWidth="4xl" padding="responsive" className={className}>
    {children}
  </ResponsiveContainer>
);

export const FormContainer = ({ children, className = '' }) => (
  <ResponsiveContainer maxWidth="md" padding="responsive" className={className}>
    {children}
  </ResponsiveContainer>
);

export const CardContainer = ({ children, className = '' }) => (
  <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
    <ResponsiveContainer maxWidth="full" padding="md">
      {children}
    </ResponsiveContainer>
  </div>
);

export default ResponsiveContainer;