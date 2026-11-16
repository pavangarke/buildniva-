import React from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { Hero } from './components/home/Hero.js';
import { CategoryGrid } from './components/home/CategoryGrid.js';
import { EstimatorWidget } from './components/home/EstimatorWidget.js';
import { MaterialsMarketplace } from './components/materials/MaterialsMarketplace.js';
import { EquipmentMarketplace } from './components/equipment/EquipmentMarketplace.js';
import { ProfessionalsMarketplace } from './components/professionals/ProfessionalsMarketplace.js';
import { LabourMarketplace } from './components/labour/LabourMarketplace.js';
import { ContractorsMarketplace } from './components/contractors/ContractorsMarketplace.js';
import { OrdersView } from './components/orders/OrdersView.js';
import { ProjectTimeline } from './components/timeline/ProjectTimeline.js';
import { PortalContainer } from './components/dashboards/PortalContainer.js';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard.js';
import { AdminDashboard } from './components/dashboards/AdminDashboard.js';
import { CartDrawer } from './components/cart/CartDrawer.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { RegisterPage } from './components/auth/RegisterPage.js';
import { AiAssistantModal } from './components/home/AiAssistantModal.js';
import { CheckCircle2, AlertCircle, Info, X, Shield, ArrowRight } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-xl border text-xs flex items-start justify-between gap-3 transition-all ${
            t.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : t.type === 'error'
              ? 'bg-red-950 text-white border-red-800'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
            <div>
              <div className="font-bold leading-tight">{t.title}</div>
              {t.message && <div className="mt-0.5 text-slate-300 font-normal leading-relaxed">{t.message}</div>}
            </div>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, setAuthModalOpen, setCurrentUser, showToast } = useApp();

  return (
    <main className="flex-1">
      {activeTab === 'home' && (
        <>
          <Hero />
          <CategoryGrid />
          <EstimatorWidget />

          {/* Onboarding Call to Action Banner */}
          <div className="bg-slate-900 text-white py-14 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    For Suppliers & Contractors
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Grow Your Construction Supply Business on BuildNiva
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                    Directly reach thousands of active residential villa builders, commercial developers, and site contractors looking for daily supply orders and heavy machinery rentals.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Sell on BuildNiva (Register)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Register as Consultant / Contractor
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    BuildNiva Marketplace Guarantee
                  </div>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Zero simulated payments: Clear development transaction sandbox warnings.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>On-site OTP verification protects both customer and delivery carrier.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Full GST tax invoices with HSN/SAC codes for input tax credits.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'materials' && <MaterialsMarketplace />}
      {activeTab === 'equipment' && <EquipmentMarketplace />}
      {activeTab === 'professionals' && <ProfessionalsMarketplace />}
      {activeTab === 'labour' && <LabourMarketplace />}
      {activeTab === 'contractors' && <ContractorsMarketplace />}
      {activeTab === 'orders' && <OrdersView />}
      {activeTab === 'timeline' && <ProjectTimeline />}
      {activeTab === 'dashboard' && <PortalContainer />}
      {activeTab === 'customer_dashboard' && <CustomerDashboard />}
      {activeTab === 'admin' && <AdminDashboard />}
      {activeTab === 'register' && (
        <RegisterPage
          onSuccess={(user) => {
            setCurrentUser(user);
            showToast('Welcome to BuildNiva!', `${user.name} registered as ${user.role.replace('_', ' ')}.`, 'success');
            if (user.role === 'customer') {
              setActiveTab('home');
            } else if (user.role === 'admin') {
              setActiveTab('admin');
            } else {
              setActiveTab('dashboard');
            }
          }}
          onNavigateToLogin={() => setAuthModalOpen(true)}
          onNavigateToHome={() => setActiveTab('home')}
        />
      )}
    </main>
  );
};

export default function App() {
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  React.useEffect(() => {
    (window as any).__openAiAdvisor = () => setAiModalOpen(true);
  }, []);

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Header />
        <MainContent />
        <Footer />
        <CartDrawer />
        <AuthModal />
        <AiAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
