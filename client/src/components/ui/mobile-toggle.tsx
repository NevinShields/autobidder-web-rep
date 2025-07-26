import React from 'react';

interface MobileToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MobileToggle({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  size = 'md',
  className = '' 
}: MobileToggleProps) {
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7', 
    lg: 'w-14 h-8'
  };
  
  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-1',
    md: checked ? 'translate-x-5' : 'translate-x-1', 
    lg: checked ? 'translate-x-6' : 'translate-x-1'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        ${sizeClasses[size]}
        relative inline-flex items-center rounded-full
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked 
          ? 'bg-blue-600 shadow-lg' 
          : 'bg-gray-300 shadow-inner'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-lg active:scale-95'
        }
        ${className}
      `}
    >
      <span
        className={`
          ${thumbSizeClasses[size]}
          ${translateClasses[size]}
          inline-block rounded-full bg-white shadow-lg
          transition-all duration-200 ease-in-out
          transform
          ${checked ? 'shadow-xl' : 'shadow-md'}
        `}
      />
      <span className="sr-only">
        {checked ? 'Enabled' : 'Disabled'}
      </span>
    </button>
  );
}