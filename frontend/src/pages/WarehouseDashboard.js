import { useState, useEffect } from 'react';
import { useSupplyChain, roleThemes } from '@/context/SupplyChainContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Gauge, Truck, AlertTriangle, Thermometer, Droplets, RefreshCw,
  ArrowRight, Package, ShieldCheck, Box, Activity, Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const theme = roleThemes.warehouse;

function MetricCard({ icon: Icon, label, value, sub, alert }) {
  return (
    <div className={`${theme.cardClass} metric-card animate-fade-in-up`} data-testid={`wh-metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`overline ${theme.textMuted} mb-2`}>{label}</p>
          <p className={`font-heading text-3xl font-extrabold tracking-tight ${alert ? 'text-[#FBBF24]' : theme.textMain}`}>{value}</p>
          {sub && <p className={`text-sm mt-1 ${theme.textMuted}`}>{sub}</p>}
        </div>
        <div className="p-3 rounded-sm bg-[#2563EB]/10">
          <Icon className="w-5 h-5 text-[#60A5FA]" />
        </div>
      </div>
    </div>
  );
}

function IoTPanel() {
  const { iotData, refreshIoT } = useSupplyChain();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshIoT();
    setTimeout(() => setRefreshing(false), 500);
  };

  const statusColors = {
    normal: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  };

  return (
    <div className={`${theme.cardClass} animate-fade-in-up`} data-testid="iot-panel">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`font-heading text-lg font-bold ${theme.textMain}`}>IoT Environment Monitoring</h3>
          <p className={`text-xs ${theme.textMuted}`}>Real-time sensor readings</p>
        </div>
        <button data-testid="refresh-iot-btn" onClick={handleRefresh}
          className={`p-2 rounded-sm border ${theme.border} hover:bg-[#2563EB]/10 transition-colors`}>
          <RefreshCw className={`w-4 h-4 text-[#60A5FA] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {iotData.map((zone, i) => {
          const s = statusColors[zone.status] || statusColors.normal;
          return (
            <div key={i} className={`p-4 rounded-sm border ${theme.border} ${s.bg}`} data-testid={`iot-zone-${i}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold ${theme.textMain}`}>{zone.zone}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${s.dot} animate-pulse-glow`} />
                  <span className={`text-xs font-medium uppercase ${s.text}`}>{zone.status}</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Thermometer className={`w-4 h-4 ${s.text}`} />
                  <div>
                    <p className={`text-xl font-bold ${theme.textMain}`}>{zone.temperature}°C</p>
                    <p className={`text-xs ${theme.textMuted}`}>Temperature</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className={`w-4 h-4 ${s.text}`} />
                  <div>
                    <p className={`text-xl font-bold ${theme.textMain}`}>{zone.humidity}%</p>
                    <p className={`text-xs ${theme.textMuted}`}>Humidity</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WarehouseOverview() {
  const { dashboardMetrics } = useSupplyChain();

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Warehouse Control</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Real-time facility monitoring and operations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard icon={Gauge} label="Capacity" value={`${dashboardMetrics.capacity_utilization || 0}%`} sub={`${dashboardMetrics.current_stock || 0}/${dashboardMetrics.total_capacity || 10000} kg`} />
        <MetricCard icon={AlertTriangle} label="Spoilage Risk" value={dashboardMetrics.spoilage_risk || 0} sub="Items at risk" alert={dashboardMetrics.spoilage_risk > 0} />
        <MetricCard icon={Truck} label="Active Shipments" value={dashboardMetrics.active_shipments || 0} sub={`${dashboardMetrics.incoming || 0} incoming`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Awaiting', value: dashboardMetrics.incoming || 0, color: 'bg-amber-500' },
          { label: 'Processing', value: dashboardMetrics.processing || 0, color: 'bg-blue-500' },
          { label: 'Dispatched', value: dashboardMetrics.dispatched || 0, color: 'bg-emerald-500' },
        ].map((item, i) => (
          <div key={i} className={`${theme.cardClass} flex items-center gap-4 animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-2 h-12 rounded-full ${item.color}`} />
            <div>
              <p className={`overline ${theme.textMuted}`}>{item.label}</p>
              <p className={`text-2xl font-bold ${theme.textMain}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <IoTPanel />
    </div>
  );
}

function StockManagement() {
  const { orders, updateOrderStatus } = useSupplyChain();
  const [search, setSearch] = useState('');

  const statusFlow = { awaiting: 'processing', processing: 'dispatched' };
  const orderStatusFlow = { pending: 'confirmed', confirmed: 'in_transit', in_transit: 'delivered' };

  const filteredOrders = orders.filter(o =>
    search === '' || o.item_name.toLowerCase().includes(search.toLowerCase()) || o.retailer_name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {
    awaiting: filteredOrders.filter(o => o.warehouse_status === 'awaiting'),
    processing: filteredOrders.filter(o => o.warehouse_status === 'processing'),
    dispatched: filteredOrders.filter(o => o.warehouse_status === 'dispatched'),
  };

  const handleAdvance = async (order) => {
    const nextWh = statusFlow[order.warehouse_status];
    const nextOrd = orderStatusFlow[order.status];
    const update = {};
    if (nextWh) update.warehouse_status = nextWh;
    if (nextOrd) update.status = nextOrd;
    if (Object.keys(update).length > 0) await updateOrderStatus(order.id, update);
  };

  const columnConfig = [
    { key: 'awaiting', label: 'Incoming', color: 'border-amber-500', dotColor: 'bg-amber-500' },
    { key: 'processing', label: 'Processing', color: 'border-blue-500', dotColor: 'bg-blue-500' },
    { key: 'dispatched', label: 'Dispatched', color: 'border-emerald-500', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Stock Management</h2>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>Track incoming, processing, and outgoing shipments</p>
        </div>
      </div>
      <div className={`${theme.cardClass} !p-4 mb-6 flex items-center gap-3`} data-testid="stock-search-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input data-testid="stock-search" placeholder="Search by item or retailer..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#0D0E14] border-[#272B3B] text-[#F1F5F9] placeholder:text-[#94A3B8]" />
        </div>
        {search && (
          <button data-testid="stock-clear-search" onClick={() => setSearch('')} className="text-xs text-[#60A5FA] hover:underline">Clear</button>
        )}
        <span className="text-xs text-[#94A3B8]">{filteredOrders.length} orders</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columnConfig.map(({ key, label, color, dotColor }) => (
          <div key={key} className={`${theme.cardClass} border-t-2 ${color}`} data-testid={`stock-column-${key}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              <h3 className={`font-heading text-base font-bold ${theme.textMain}`}>{label}</h3>
              <Badge className="bg-[#272B3B] text-[#94A3B8] border-0 ml-auto">{grouped[key].length}</Badge>
            </div>
            <div className="space-y-3">
              {grouped[key].length === 0 && <p className={`text-sm ${theme.textMuted} text-center py-4`}>No items</p>}
              {grouped[key].map((order) => (
                <div key={order.id} className={`p-3 rounded-sm border ${theme.border} hover:border-[#2563EB]/30 transition-colors`} data-testid={`stock-item-${order.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${theme.textMain}`}>{order.item_name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>{order.quantity} {order.unit}</p>
                  </div>
                  <p className={`text-xs ${theme.textMuted} mb-2`}>{order.retailer_name}</p>
                  {key !== 'dispatched' && (
                    <button data-testid={`advance-order-${order.id}`} onClick={() => handleAdvance(order)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-sm bg-[#2563EB]/10 text-[#60A5FA] hover:bg-[#2563EB]/20 transition-colors">
                      <ArrowRight className="w-3 h-3" />
                      Move to {statusFlow[key] === 'processing' ? 'Processing' : 'Dispatched'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityStorage() {
  const { inventory } = useSupplyChain();

  const bays = Array.from({ length: 16 }, (_, i) => {
    const item = inventory[i % inventory.length];
    const occupancy = item ? Math.min(100, Math.round((item.quantity / 500) * 100)) : 0;
    return {
      id: `Bay ${String.fromCharCode(65 + Math.floor(i / 4))}-${(i % 4) + 1}`,
      item: item?.name || 'Empty',
      occupancy,
      grade: item?.quality_grade || '-',
    };
  });

  const getOccupancyColor = (occ) => {
    if (occ === 0) return 'bg-[#1a1c28]';
    if (occ < 30) return 'bg-emerald-900/40';
    if (occ < 60) return 'bg-emerald-700/40';
    if (occ < 85) return 'bg-amber-700/40';
    return 'bg-red-800/40';
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Quality & Storage</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Smart space allocation and quality grading</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={theme.cardClass} data-testid="space-allocation-grid">
          <h3 className={`font-heading text-base font-bold ${theme.textMain} mb-4`}>Smart Space Allocation</h3>
          <div className="grid grid-cols-4 gap-2">
            {bays.map((bay, i) => (
              <div key={i} className={`${getOccupancyColor(bay.occupancy)} p-3 rounded-sm border ${theme.border} bay-cell cursor-default`} data-testid={`bay-${i}`}>
                <p className="text-[10px] font-bold text-[#94A3B8]">{bay.id}</p>
                <p className={`text-xs font-medium mt-1 ${theme.textMain} truncate`}>{bay.item}</p>
                <div className="mt-2">
                  <Progress value={bay.occupancy} className="h-1 bg-[#272B3B]" />
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">{bay.occupancy}%</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-900/40" /><span className="text-xs text-[#94A3B8]">Low</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-700/40" /><span className="text-xs text-[#94A3B8]">Medium</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-800/40" /><span className="text-xs text-[#94A3B8]">High</span></div>
          </div>
        </div>
        <div className={theme.cardClass} data-testid="quality-grading-table">
          <h3 className={`font-heading text-base font-bold ${theme.textMain} mb-4`}>Product Quality Grading</h3>
          <Table>
            <TableHeader>
              <TableRow className="border-[#272B3B]">
                <TableHead className="text-[#94A3B8]">Product</TableHead>
                <TableHead className="text-[#94A3B8]">Grade</TableHead>
                <TableHead className="text-[#94A3B8]">Stock</TableHead>
                <TableHead className="text-[#94A3B8]">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const isRisk = ['C', 'D'].includes(item.quality_grade);
                return (
                  <TableRow key={item.id} className="border-[#272B3B]">
                    <TableCell className={theme.textMain}>{item.name}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${item.quality_grade === 'A+' || item.quality_grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' : item.quality_grade === 'B' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {item.quality_grade}
                      </Badge>
                    </TableCell>
                    <TableCell className={theme.textMain}>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{isRisk ? <AlertTriangle className="w-4 h-4 text-[#FBBF24]" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function WarehouseAlerts() {
  const { alerts } = useSupplyChain();
  const warehouseAlerts = alerts.filter(a => a.role === 'warehouse' || a.role === 'all');

  const severityConfig = {
    critical: { bg: 'bg-red-500/10 border-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
    warning: { bg: 'bg-amber-500/10 border-amber-500/20', icon: 'text-amber-400', text: 'text-amber-400' },
    info: { bg: 'bg-blue-500/10 border-blue-500/20', icon: 'text-blue-400', text: 'text-blue-400' },
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>System Alerts</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Climate warnings and stock alerts</p>
      </div>
      <div className="space-y-3" data-testid="warehouse-alerts-list">
        {warehouseAlerts.length === 0 && <p className={`text-sm ${theme.textMuted}`}>No alerts</p>}
        {warehouseAlerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity] || severityConfig.info;
          return (
            <div key={alert.id || i} className={`${theme.cardClass} !p-4 flex items-start gap-4 border ${cfg.bg} animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }} data-testid={`wh-alert-${i}`}>
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`border-0 text-xs uppercase ${cfg.bg} ${cfg.text}`}>{alert.severity}</Badge>
                  <Badge className="border-0 text-xs bg-[#272B3B] text-[#94A3B8]">{alert.type}</Badge>
                </div>
                <p className={`text-sm ${theme.textMain}`}>{alert.message}</p>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>{new Date(alert.created_at).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WarehouseDashboard() {
  const { activeTab } = useSupplyChain();
  switch (activeTab) {
    case 'dashboard': return <WarehouseOverview />;
    case 'stock': return <StockManagement />;
    case 'storage': return <QualityStorage />;
    case 'alerts': return <WarehouseAlerts />;
    default: return <WarehouseOverview />;
  }
}
