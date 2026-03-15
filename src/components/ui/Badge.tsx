import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dotted?: boolean;
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dotted = false,
  className = '',
  ...props
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    secondary: 'bg-slate-700/50 text-slate-300 border border-slate-600',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dottedClasses = dotted ? 'pl-1.5' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${dottedClasses} ${className}`}
      {...props}
    >
      {dotted && (
        <span className={`inline-block rounded-full ${
          variant === 'primary' ? 'bg-blue-400' :
          variant === 'success' ? 'bg-green-400' :
          variant === 'warning' ? 'bg-yellow-400' :
          variant === 'danger' ? 'bg-red-400' :
          'bg-slate-500'
        }`} style={{ width: '6px', height: '6px' }} />
      )}
      {children}
    </span>
  );
}
