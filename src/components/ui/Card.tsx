import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  hoverable = true,
  className = '',
  ...props
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default:
      'bg-slate-900 border border-slate-800 rounded-lg shadow-sm',
    elevated:
      'bg-slate-900 rounded-lg shadow-lg shadow-black/50 border border-slate-700',
    outlined:
      'bg-transparent border-2 border-slate-700 rounded-lg',
  };

  const hoverClasses = hoverable
    ? 'hover:border-slate-700 hover:shadow-md transition-all duration-200'
    : '';

  const clickableClasses = clickable ? 'cursor-pointer' : '';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
