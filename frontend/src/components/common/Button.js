import React from 'react';
import classNames from 'classnames';
import LoadingSpinner from './LoadingSpinner';
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  responsive = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ariaLabel,
  ...props
}) => {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const baseClasses = classNames(
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-2',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:transform active:scale-[0.98]',
    {
      'w-full': fullWidth,
      'transform-none transition-colors': prefersReducedMotion,
    }
  );

  const variants = {
    primary: classNames(
      'bg-blue-600 text-white shadow-sm',
      'hover:bg-blue-700 hover:shadow-md',
      'focus:ring-blue-500 focus:bg-blue-700',
      'dark:bg-blue-500 dark:hover:bg-blue-600'
    ),
    secondary: classNames(
      'bg-gray-100 text-gray-900 shadow-sm border border-gray-200',
      'hover:bg-gray-200 hover:border-gray-300',
      'focus:ring-gray-500 focus:bg-gray-200',
      'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
    ),
    danger: classNames(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'focus:ring-red-500 focus:bg-red-700'
    ),
    success: classNames(
      'bg-green-600 text-white shadow-sm',
      'hover:bg-green-700 hover:shadow-md',
      'focus:ring-green-500 focus:bg-green-700'
    ),
    warning: classNames(
      'bg-yellow-500 text-white shadow-sm',
      'hover:bg-yellow-600 hover:shadow-md',
      'focus:ring-yellow-500 focus:bg-yellow-600'
    ),
    outline: classNames(
      'border border-gray-300 text-gray-700 bg-white shadow-sm',
      'hover:bg-gray-50 hover:border-gray-400',
      'focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-50',
      'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
    ),
    ghost: classNames(
      'text-gray-700 bg-transparent',
      'hover:bg-gray-100',
      'focus:ring-gray-500 focus:bg-gray-100',
      'dark:text-gray-300 dark:hover:bg-gray-800'
    ),
    link: classNames(
      'text-blue-600 bg-transparent p-0 h-auto font-normal',
      'hover:text-blue-700 hover:underline',
      'focus:ring-blue-500 focus:text-blue-700',
      'dark:text-blue-400 dark:hover:text-blue-300'
    )
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs min-h-[1.75rem]',
    sm: 'px-3 py-1.5 text-sm min-h-[2rem]',
    md: 'px-4 py-2 text-sm min-h-[2.25rem]',
    lg: 'px-6 py-3 text-base min-h-[2.75rem]',
    xl: 'px-8 py-4 text-lg min-h-[3.25rem]'
  };

  // Responsive size adjustment
  const responsiveSize = responsive && isMobile 
    ? size === 'xl' ? 'lg' : size === 'lg' ? 'md' : size
    : size;

  const classes = classNames(
    baseClasses,
    variants[variant],
    sizes[responsiveSize],
    className
  );

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const iconElement = Icon && (
    <Icon 
      className={classNames(
        'flex-shrink-0',
        responsiveSize === 'xs' ? 'h-3 w-3' : 
        responsiveSize === 'sm' ? 'h-4 w-4' : 
        responsiveSize === 'lg' ? 'h-5 w-5' :
        responsiveSize === 'xl' ? 'h-6 w-6' : 'h-4 w-4',
        {
          'mr-2': iconPosition === 'left' && children,
          'ml-2': iconPosition === 'right' && children,
        }
      )} 
    />
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size={responsiveSize === 'xs' ? 'xs' : 'sm'} 
          className={classNames('animate-spin', {
            'mr-2': children
          })} 
        />
      )}
      
      {!loading && iconPosition === 'left' && iconElement}
      
      {children && (
        <span className={classNames({
          'sr-only': Icon && !children,
          'truncate': true
        })}>
          {children}
        </span>
      )}
      
      {!loading && iconPosition === 'right' && iconElement}
    </button>
  );
};

// Button group component for related actions
export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal',
  size = 'md',
  className = '',
  ...props 
}) => {
  const isVertical = orientation === 'vertical';
  
  const classes = classNames(
    'inline-flex',
    isVertical ? 'flex-col' : 'flex-row',
    className
  );

  return (
    <div className={classes} role="group" {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          size: child.props.size || size,
          className: classNames(
            child.props.className,
            isVertical ? {
              'rounded-none': true,
              'rounded-t-lg': index === 0,
              'rounded-b-lg': index === React.Children.count(children) - 1,
              'border-b-0': index !== React.Children.count(children) - 1,
            } : {
              'rounded-none': true,
              'rounded-l-lg': index === 0,
              'rounded-r-lg': index === React.Children.count(children) - 1,
              'border-r-0': index !== React.Children.count(children) - 1,
            }
          )
        });
      })}
    </div>
  );
};

export default Button;