import React from 'react';
import { cn } from "@/lib/utils";

interface MobileToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export function MobileToggle({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  size = 'md',
  className = '',
  id
}: MobileToggleProps) {
  const inputId = id || `mobile-toggle-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizeClasses = {
    sm: 'ios-switch-sm',
    md: 'ios-switch-md', 
    lg: 'ios-switch-lg'
  };

  return (
    <div className={cn("ios-switch", sizeClasses[size], className)}>
      <input
        className="ios-switch-input"
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        aria-label={checked ? 'Enabled' : 'Disabled'}
      />
      <label className="ios-switch-label" htmlFor={inputId} />
    </div>
  );
}