import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'w-9 h-9 p-0.5',
  md: 'w-11 h-11 p-0.5',
  lg: 'w-14 h-14 p-1',
  xl: 'w-16 h-16 p-1',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#FAFAFA] border border-slate-200/90 shadow-sm shrink-0 overflow-hidden ${SIZE_CLASSES[size]} ${className}`}
    >
      <img
        src="/assets/buildniva-logo-white.jpg"
        alt="BuildNiva Logo"
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
};
