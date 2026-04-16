import "@/App.css";
import { Toaster } from "sonner";
import { SupplyChainProvider, useSupplyChain, roleThemes } from "@/context/SupplyChainContext";
import Sidebar from "@/components/layout/Sidebar";
import FarmerDashboard from "@/pages/FarmerDashboard";
import WarehouseDashboard from "@/pages/WarehouseDashboard";
import RetailerDashboard from "@/pages/RetailerDashboard";
import ProfilePage from "@/pages/ProfilePage";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { activeRole, activeTab, loading } = useSupplyChain();
  const theme = roleThemes[activeRole];

  const renderContent = () => {
    if (activeTab === 'profile') return <ProfilePage />;
    switch (activeRole) {
      case 'farmer': return <FarmerDashboard />;
      case 'warehouse': return <WarehouseDashboard />;
      case 'retailer': return <RetailerDashboard />;
      default: return <FarmerDashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} role-transition font-body`} data-testid="app-root">
      <Sidebar />
      <main className="ml-64 p-8 min-h-screen" data-testid="main-content">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className={`w-8 h-8 animate-spin ${theme.primaryText}`} />
          </div>
        ) : (
          <div className="animate-fade-in max-w-[1400px]">
            {renderContent()}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <SupplyChainProvider>
      <AppContent />
      <Toaster position="top-right" richColors closeButton />
    </SupplyChainProvider>
  );
}

export default App;
