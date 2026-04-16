import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SupplyChainContext = createContext(null);

export const roleThemes = {
  farmer: {
    bg: 'bg-[#F7F9F4]',
    surfaceBg: 'bg-white',
    primary: '#2E5C3A',
    primaryBg: 'bg-[#2E5C3A]',
    primaryHover: 'hover:bg-[#1F4028]',
    primaryText: 'text-[#2E5C3A]',
    textMain: 'text-[#1C2B20]',
    textMuted: 'text-[#5B7062]',
    border: 'border-[#E2E8DE]',
    sidebarBg: 'bg-white',
    sidebarBorder: 'border-r border-[#E2E8DE]',
    sidebarText: 'text-[#1C2B20]',
    activeBg: 'bg-[#2E5C3A]/10',
    activeText: 'text-[#2E5C3A]',
    activeBorderL: 'border-l-[3px] border-[#2E5C3A]',
    btnPrimary: 'bg-[#2E5C3A] text-white hover:bg-[#1F4028] focus:ring-[#2E5C3A]',
    cardClass: 'bg-white rounded-2xl shadow-sm border border-[#E2E8DE] p-6',
    inputBorder: 'border-[#E2E8DE] focus:border-[#2E5C3A] focus:ring-[#2E5C3A]/20',
    label: 'Farmer',
  },
  warehouse: {
    bg: 'bg-[#090A0F]',
    surfaceBg: 'bg-[#12141D]',
    primary: '#2563EB',
    primaryBg: 'bg-[#2563EB]',
    primaryHover: 'hover:bg-[#1D4ED8]',
    primaryText: 'text-[#2563EB]',
    textMain: 'text-[#F1F5F9]',
    textMuted: 'text-[#94A3B8]',
    border: 'border-[#272B3B]',
    sidebarBg: 'bg-[#0D0E14]',
    sidebarBorder: 'border-r border-[#272B3B]',
    sidebarText: 'text-[#F1F5F9]',
    activeBg: 'bg-[#2563EB]/10',
    activeText: 'text-[#60A5FA]',
    activeBorderL: 'border-l-[3px] border-[#2563EB]',
    btnPrimary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB]',
    cardClass: 'bg-[#12141D] rounded-sm border border-[#272B3B] p-6',
    inputBorder: 'border-[#272B3B] bg-[#0D0E14] text-[#F1F5F9] focus:border-[#2563EB]',
    label: 'Warehouse',
  },
  retailer: {
    bg: 'bg-[#FFFDF7]',
    surfaceBg: 'bg-white',
    primary: '#EA580C',
    primaryBg: 'bg-[#EA580C]',
    primaryHover: 'hover:bg-[#C2410C]',
    primaryText: 'text-[#EA580C]',
    textMain: 'text-[#0F172A]',
    textMuted: 'text-[#475569]',
    border: 'border-black/10',
    sidebarBg: 'bg-white',
    sidebarBorder: 'border-r-2 border-black/10',
    sidebarText: 'text-[#0F172A]',
    activeBg: 'bg-[#EA580C]/10',
    activeText: 'text-[#EA580C]',
    activeBorderL: 'border-l-[3px] border-[#EA580C]',
    btnPrimary: 'bg-[#EA580C] text-white hover:bg-[#C2410C] focus:ring-[#EA580C]',
    cardClass: 'bg-white rounded-lg border-2 border-black/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.08)] p-6',
    inputBorder: 'border-black/10 focus:border-[#EA580C] focus:ring-[#EA580C]/20',
    label: 'Retailer',
  },
};

export const navConfig = {
  farmer: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'inventory', label: 'Produce Listing', icon: 'Sprout' },
    { id: 'harvest', label: 'Harvest Tracking', icon: 'CalendarDays' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
  ],
  warehouse: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'stock', label: 'Stock Management', icon: 'Boxes' },
    { id: 'storage', label: 'Quality & Storage', icon: 'Gauge' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle' },
  ],
  retailer: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'orders', label: 'Order Management', icon: 'ShoppingCart' },
    { id: 'shelves', label: 'Inventory View', icon: 'PackageOpen' },
    { id: 'sales', label: 'Sales Tracking', icon: 'Receipt' },
  ],
};

export function SupplyChainProvider({ children }) {
  const [activeRole, setActiveRole] = useState('farmer');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sales, setSales] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [iotData, setIotData] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const seedData = useCallback(async () => {
    try {
      await axios.post(`${API}/seed`);
      setSeeded(true);
    } catch (e) {
      console.error('Seed error:', e);
      setSeeded(true);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, ordRes, alertRes, salesRes, dashRes, profileRes] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/alerts?role=${activeRole}`),
        axios.get(`${API}/sales`),
        axios.get(`${API}/dashboard/${activeRole}`),
        axios.get(`${API}/profiles/${activeRole}`),
      ]);
      setInventory(invRes.data);
      setOrders(ordRes.data);
      setAlerts(alertRes.data);
      setSales(salesRes.data);
      setDashboardMetrics(dashRes.data);
      setProfile(profileRes.data);

      if (activeRole === 'warehouse') {
        const iotRes = await axios.get(`${API}/warehouse/iot`);
        setIotData(iotRes.data);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    seedData();
  }, [seedData]);

  useEffect(() => {
    if (seeded) fetchAllData();
  }, [seeded, fetchAllData]);

  useEffect(() => {
    setActiveTab('dashboard');
  }, [activeRole]);

  const addInventory = async (item) => {
    try {
      const res = await axios.post(`${API}/inventory`, item);
      toast.success(`${item.name} added to inventory`);
      await fetchAllData();
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add item');
      throw e;
    }
  };

  const updateInventory = async (id, data) => {
    try {
      const res = await axios.put(`${API}/inventory/${id}`, data);
      toast.success('Item updated');
      await fetchAllData();
      return res.data;
    } catch (e) {
      toast.error('Failed to update item');
      throw e;
    }
  };

  const deleteInventory = async (id) => {
    try {
      await axios.delete(`${API}/inventory/${id}`);
      toast.success('Item removed');
      await fetchAllData();
    } catch (e) {
      toast.error('Failed to delete item');
      throw e;
    }
  };

  const placeOrder = async (order) => {
    try {
      const res = await axios.post(`${API}/orders`, order);
      toast.success(`Order placed for ${order.quantity} ${order.unit} of ${order.item_name}`);
      await fetchAllData();
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to place order');
      throw e;
    }
  };

  const updateOrderStatus = async (id, data) => {
    try {
      const res = await axios.put(`${API}/orders/${id}/status`, data);
      toast.success('Order status updated');
      await fetchAllData();
      return res.data;
    } catch (e) {
      toast.error('Failed to update order');
      throw e;
    }
  };

  const addSale = async (sale) => {
    try {
      const res = await axios.post(`${API}/sales`, sale);
      toast.success('Sale recorded');
      await fetchAllData();
      return res.data;
    } catch (e) {
      toast.error('Failed to record sale');
      throw e;
    }
  };

  const updateProfile = async (data) => {
    try {
      await axios.put(`${API}/profiles/${activeRole}`, data);
      toast.success('Profile updated');
      await fetchAllData();
    } catch (e) {
      toast.error('Failed to update profile');
      throw e;
    }
  };

  const refreshIoT = async () => {
    try {
      const res = await axios.get(`${API}/warehouse/iot`);
      setIotData(res.data);
    } catch (e) {
      console.error('IoT fetch error:', e);
    }
  };

  return (
    <SupplyChainContext.Provider value={{
      activeRole, setActiveRole, activeTab, setActiveTab,
      inventory, orders, alerts, sales, dashboardMetrics, iotData, profile,
      loading,
      addInventory, updateInventory, deleteInventory,
      placeOrder, updateOrderStatus, addSale, updateProfile,
      fetchAllData, refreshIoT,
    }}>
      {children}
    </SupplyChainContext.Provider>
  );
}

export const useSupplyChain = () => {
  const ctx = useContext(SupplyChainContext);
  if (!ctx) throw new Error('useSupplyChain must be used within SupplyChainProvider');
  return ctx;
};
