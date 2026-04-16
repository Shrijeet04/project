import { useState } from 'react';
import { useSupplyChain, roleThemes } from '@/context/SupplyChainContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sprout, DollarSign, Clock, Plus, Pencil, Trash2,
  TrendingUp, Package, CalendarDays, Check, X, Bell,
  Search, ArrowUpDown, ArrowUp, ArrowDown, Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const theme = roleThemes.farmer;

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className={`${theme.cardClass} metric-card animate-fade-in-up`} data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`overline ${theme.textMuted} mb-2`}>{label}</p>
          <p className={`font-heading text-3xl font-extrabold tracking-tight ${theme.textMain}`}>{value}</p>
          {sub && <p className={`text-sm mt-1 ${theme.textMuted}`}>{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${theme.activeBg}`}>
          <Icon className={`w-5 h-5 ${theme.primaryText}`} />
        </div>
      </div>
    </div>
  );
}

function FarmerOverview() {
  const { dashboardMetrics, inventory } = useSupplyChain();
  const harvestData = (dashboardMetrics.harvest_data || []).slice(0, 8);

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>
          Farm Dashboard
        </h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Overview of your farm operations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard icon={Sprout} label="Active Listings" value={dashboardMetrics.total_listings || 0} sub={`${dashboardMetrics.total_items || 0} total items`} />
        <MetricCard icon={DollarSign} label="Recent Earnings" value={`$${(dashboardMetrics.recent_earnings || 0).toLocaleString()}`} sub="From confirmed orders" />
        <MetricCard icon={Clock} label="Pending Orders" value={dashboardMetrics.pending_orders || 0} sub="Awaiting processing" />
      </div>
      <div className={`${theme.cardClass} animate-fade-in-up`}>
        <h3 className={`font-heading text-lg font-bold ${theme.textMain} mb-4`}>Harvest Output by Crop</h3>
        {harvestData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={harvestData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8DE" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5B7062' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5B7062' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8DE' }} />
              <Bar dataKey="quantity" fill="#2E5C3A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={`text-sm ${theme.textMuted}`}>No harvest data available.</p>
        )}
      </div>
    </div>
  );
}

function ProduceListing() {
  const { inventory, addInventory, updateInventory, deleteInventory } = useSupplyChain();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'kg', quality_grade: 'A', price_per_unit: '', category: 'vegetables', farmer_name: 'Green Valley Farm' });
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

  const resetForm = () => setForm({ name: '', quantity: '', unit: 'kg', quality_grade: 'A', price_per_unit: '', category: 'vegetables', farmer_name: 'Green Valley Farm' });

  const openAdd = () => { resetForm(); setEditItem(null); setDialogOpen(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, quantity: String(item.quantity), unit: item.unit, quality_grade: item.quality_grade, price_per_unit: String(item.price_per_unit), category: item.category, farmer_name: item.farmer_name });
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = { ...form, quantity: parseFloat(form.quantity) || 0, price_per_unit: parseFloat(form.price_per_unit) || 0, harvest_date: new Date().toISOString() };
    try {
      if (editItem) { await updateInventory(editItem.id, data); }
      else { await addInventory(data); }
      setDialogOpen(false);
    } catch {}
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortConfig.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = inventory
    .filter(i => search === '' || i.name.toLowerCase().includes(search.toLowerCase()) || i.farmer_name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => gradeFilter === 'all' || i.quality_grade === gradeFilter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key];
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortConfig.dir === 'asc' ? cmp : -cmp;
    });

  const gradeColors = { 'A+': 'bg-emerald-100 text-emerald-800', 'A': 'bg-green-100 text-green-800', 'B': 'bg-amber-100 text-amber-800', 'C': 'bg-orange-100 text-orange-800', 'D': 'bg-red-100 text-red-800' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Produce Listing</h2>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>Manage your crop listings and pricing</p>
        </div>
        <button data-testid="add-produce-btn" onClick={openAdd} className={`${theme.btnPrimary} px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors focus:ring-2 focus:ring-offset-2`}>
          <Plus className="w-4 h-4" /> Add Produce
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className={`${theme.cardClass} !p-4 mb-6 flex flex-wrap items-center gap-3`} data-testid="produce-filter-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
          <Input data-testid="produce-search" placeholder="Search by name or farm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${theme.textMuted}`} />
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger data-testid="produce-filter-grade" className="w-[120px]"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="produce-filter-status" className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search || gradeFilter !== 'all' || statusFilter !== 'all') && (
          <button data-testid="produce-clear-filters" onClick={() => { setSearch(''); setGradeFilter('all'); setStatusFilter('all'); setSortConfig({ key: null, dir: 'asc' }); }}
            className={`text-xs font-medium ${theme.primaryText} hover:underline`}>Clear filters</button>
        )}
        <span className={`text-xs ${theme.textMuted} ml-auto`}>{filtered.length} of {inventory.length} items</span>
      </div>

      <div className={`${theme.cardClass} !p-0 overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="border-[#E2E8DE]">
              <TableHead className={`${theme.textMuted} font-semibold cursor-pointer select-none`} onClick={() => handleSort('name')}>
                <span className="flex items-center">Produce<SortIcon col="name" /></span>
              </TableHead>
              <TableHead className={`${theme.textMuted} font-semibold cursor-pointer select-none`} onClick={() => handleSort('quantity')}>
                <span className="flex items-center">Quantity<SortIcon col="quantity" /></span>
              </TableHead>
              <TableHead className={`${theme.textMuted} font-semibold cursor-pointer select-none`} onClick={() => handleSort('quality_grade')}>
                <span className="flex items-center">Grade<SortIcon col="quality_grade" /></span>
              </TableHead>
              <TableHead className={`${theme.textMuted} font-semibold cursor-pointer select-none`} onClick={() => handleSort('price_per_unit')}>
                <span className="flex items-center">Price/Unit<SortIcon col="price_per_unit" /></span>
              </TableHead>
              <TableHead className={`${theme.textMuted} font-semibold`}>Status</TableHead>
              <TableHead className={`${theme.textMuted} font-semibold text-right`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className={`text-center py-12 ${theme.textMuted}`}>{inventory.length === 0 ? 'No produce listed yet. Add your first crop above.' : 'No items match your filters.'}</TableCell></TableRow>
            ) : filtered.map((item) => (
              <TableRow key={item.id} className="border-[#E2E8DE]" data-testid={`produce-row-${item.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2E5C3A]/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#2E5C3A]" />
                    </div>
                    <div>
                      <p className={`font-medium ${theme.textMain}`}>{item.name}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{item.farmer_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={theme.textMain}>{item.quantity} {item.unit}</TableCell>
                <TableCell><Badge className={`${gradeColors[item.quality_grade] || 'bg-gray-100 text-gray-800'} border-0`}>{item.quality_grade}</Badge></TableCell>
                <TableCell className={`${theme.textMain} font-medium`}>${item.price_per_unit.toFixed(2)}</TableCell>
                <TableCell><Badge className={`border-0 ${item.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{item.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button data-testid={`edit-produce-${item.id}`} onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-[#2E5C3A]/10 transition-colors"><Pencil className="w-3.5 h-3.5 text-[#5B7062]" /></button>
                    <button data-testid={`delete-produce-${item.id}`} onClick={() => deleteInventory(item.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="produce-dialog">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Produce' : 'Add New Produce'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update the crop details below.' : 'Add a new crop listing to your inventory.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Produce Name</Label>
              <Input data-testid="input-produce-name" id="name" placeholder="e.g. Tomatoes" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input data-testid="input-produce-qty" id="qty" type="number" placeholder="e.g. 500" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger data-testid="select-produce-unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="crates">crates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quality Grade</Label>
                <Select value={form.quality_grade} onValueChange={v => setForm({ ...form, quality_grade: v })}>
                  <SelectTrigger data-testid="select-produce-grade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+ (Premium)</SelectItem>
                    <SelectItem value="A">A (Standard)</SelectItem>
                    <SelectItem value="B">B (Economy)</SelectItem>
                    <SelectItem value="C">C (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per Unit ($)</Label>
                <Input data-testid="input-produce-price" id="price" type="number" step="0.01" placeholder="e.g. 3.50" value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button data-testid="cancel-produce-btn" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E2E8DE] hover:bg-gray-50 transition-colors">Cancel</button>
            <button data-testid="save-produce-btn" onClick={handleSubmit} className={`${theme.btnPrimary} px-4 py-2 rounded-xl text-sm font-semibold transition-colors`}>{editItem ? 'Update' : 'Add Produce'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HarvestTracking() {
  const { inventory } = useSupplyChain();
  const sorted = [...inventory].sort((a, b) => (b.harvest_date || '').localeCompare(a.harvest_date || ''));

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Harvest Tracking</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Track your harvest dates and expected supply</p>
      </div>
      <div className="space-y-4">
        {sorted.map((item, idx) => {
          const date = item.harvest_date ? new Date(item.harvest_date) : null;
          const daysAgo = date ? Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)) : null;
          return (
            <div key={item.id} className={`${theme.cardClass} flex items-center gap-6 animate-fade-in-up`} style={{ animationDelay: `${idx * 0.05}s` }} data-testid={`harvest-item-${item.id}`}>
              <div className="flex flex-col items-center min-w-[60px]">
                <div className={`w-3 h-3 rounded-full ${daysAgo !== null && daysAgo <= 1 ? 'bg-emerald-500' : daysAgo !== null && daysAgo <= 3 ? 'bg-amber-500' : 'bg-gray-400'}`} />
                {idx < sorted.length - 1 && <div className="w-0.5 h-8 bg-[#E2E8DE] mt-1" />}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className={`font-medium ${theme.textMain}`}>{item.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{item.farmer_name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${theme.textMain}`}>{item.quantity} {item.unit}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <CalendarDays className="w-3 h-3 text-[#5B7062]" />
                    <p className={`text-xs ${theme.textMuted}`}>
                      {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      {daysAgo !== null && ` (${daysAgo === 0 ? 'Today' : `${daysAgo}d ago`})`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className={`text-sm ${theme.textMuted}`}>No harvest data available.</p>}
      </div>
    </div>
  );
}

function FarmerNotifications() {
  const { alerts, orders } = useSupplyChain();
  const farmerAlerts = alerts.filter(a => a.role === 'farmer' || a.role === 'all');

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Notifications & History</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Alerts and transaction history</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={theme.cardClass} data-testid="farmer-alerts-panel">
          <h3 className={`font-heading text-lg font-bold ${theme.textMain} mb-4`}>Alerts</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {farmerAlerts.length === 0 && <p className={`text-sm ${theme.textMuted}`}>No alerts</p>}
            {farmerAlerts.map((alert, i) => (
              <div key={alert.id || i} className={`flex items-start gap-3 p-3 rounded-xl ${alert.severity === 'warning' ? 'bg-amber-50' : alert.severity === 'critical' ? 'bg-red-50' : 'bg-[#F7F9F4]'}`} data-testid={`farmer-alert-${i}`}>
                <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'warning' ? 'text-amber-600' : alert.severity === 'critical' ? 'text-red-600' : 'text-[#2E5C3A]'}`} />
                <div>
                  <p className={`text-sm ${theme.textMain}`}>{alert.message}</p>
                  <p className={`text-xs mt-1 ${theme.textMuted}`}>{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={theme.cardClass} data-testid="farmer-orders-panel">
          <h3 className={`font-heading text-lg font-bold ${theme.textMain} mb-4`}>Order History</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {orders.length === 0 && <p className={`text-sm ${theme.textMuted}`}>No orders yet</p>}
            {orders.map((order, i) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9F4]" data-testid={`farmer-order-${i}`}>
                <div>
                  <p className={`text-sm font-medium ${theme.textMain}`}>{order.item_name} ({order.quantity} {order.unit})</p>
                  <p className={`text-xs ${theme.textMuted}`}>by {order.retailer_name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${theme.textMain}`}>${order.total_price.toFixed(2)}</p>
                  <Badge className={`border-0 text-xs ${order.status === 'delivered' || order.status === 'received' ? 'bg-emerald-100 text-emerald-800' : order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { activeTab } = useSupplyChain();
  switch (activeTab) {
    case 'dashboard': return <FarmerOverview />;
    case 'inventory': return <ProduceListing />;
    case 'harvest': return <HarvestTracking />;
    case 'notifications': return <FarmerNotifications />;
    default: return <FarmerOverview />;
  }
}
