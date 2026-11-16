import React from 'react';
import { ShoppingBag, User, LayoutDashboard, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';

export const Header: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    cartCount,
    setIsCartOpen,
    setAuthModalOpen,
  } = useApp();

  const workspaceTab =
    currentUser?.role === 'customer'
      ? 'customer_dashboard'
      : currentUser?.role === 'admin'
      ? 'admin'
      : 'dashboard';

  const isWorkspaceActive = ['dashboard', 'customer_dashboard', 'admin'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Logo & Wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <BrandLogo size="sm" />
          <span>
            Build<span className="text-amber-600">Niva</span>
          </span>
        </button>

        {/* Zone 2: Primary navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('materials')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'materials' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Materials
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'equipment' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Machinery
          </button>
          <button
            onClick={() => setActiveTab('professionals')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'professionals' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Engineers
          </button>
          <button
            onClick={() => setActiveTab('labour')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'labour' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Labour
          </button>
          <button
            onClick={() => setActiveTab('contractors')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'contractors' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Contractors
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Track Orders
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors cursor-pointer ${
              activeTab === 'timeline' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Project Timeline
          </button>
        </nav>

        {/* Zone 3: Real Account Actions & Cart */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* AI Advisor Trigger */}
          <button
            onClick={() => (window as any).__openAiAdvisor?.()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="text-amber-600 font-bold">✨</span>
            <span>AI Advisor</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => setActiveTab(workspaceTab)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isWorkspaceActive
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>
                  {currentUser.role === 'customer'
                    ? 'My Dashboard'
                    : currentUser.role === 'admin'
                    ? 'Admin'
                    : 'Portal'}
                </span>
              </button>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Account & Sign Out"
              >
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[96px] truncate">{currentUser.name.split(' ')[0]}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('register')}
                className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Register</span>
              </button>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600" />
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
