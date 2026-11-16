import React from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { BrandLogo } from '../common/BrandLogo.js';

interface SignInRequiredProps {
  title?: string;
  description?: string;
}

export const SignInRequired: React.FC<SignInRequiredProps> = ({
  title = 'Sign in to access your BuildNiva workspace',
  description = 'Sign in with your verified email and password, or create a new customer or partner account.',
}) => {
  const { setAuthModalOpen, setActiveTab } = useApp();

  return (
    <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="relative w-14 h-14 mx-auto">
          <BrandLogo size="lg" className="border-amber-200 shadow-md" />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
            <Lock className="w-3 h-3 text-amber-700" />
          </span>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
