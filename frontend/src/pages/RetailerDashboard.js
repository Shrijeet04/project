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
  DollarSign, TrendingUp, ShoppingCart, Package, Plus,
  ArrowUpRight, Check, Truck, PackageOpen,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const theme = roleThemes.retailer;

const PIE_COLORS = ['#2E5C3A', '#EA580C', '#2563EB', '#FBBF24', '#8B5CF6', '#EC4899'];

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className={`${theme.cardClass} metric-card brutalist-card animate-fade-in-up`} data-testid={`ret-metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`overline ${theme.textMuted} mb-2`}>{label}</p>
          <p className={`font-heading text-3xl font-extrabold tracking-tight ${theme.textMain}`}>{value}</p>
          {sub && <p className={`text-sm mt-1 ${theme.textMuted}`}>{sub}</p>}
        </div>
        <div className="p-3 rounded-lg bg-[#EA580C]/10">
          <Icon className="w-5 h-5 text-[#EA580C]" />
        </div>
      </div>
    </div>
  );
}

function RetailerOverview() {
  const { dashboardMetrics, sales } = useSupplyChain();
  const demandData = dashboardMetrics.demand_insights?.length > 0
    ? dashboardMetrics.demand_insights
    : [{ name: 'No data', value: 1 }];

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Retail Dashboard</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Sales overview and customer demand insights</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard icon={DollarSign} label="Total Sales" value={`$${(dashboardMetrics.daily_sales || 0).toLocaleString()}`} sub="Across all items" />
        <MetricCard icon={TrendingUp} label="Profit Margin" value={`${dashboardMetrics.profit_margin || 0}%`} sub="Estimated average" />
        <MetricCard icon={ShoppingCart} label="Total Orders" value={dashboardMetrics.total_orders || 0} sub={`${dashboardMetrics.in_transit || 0} in transit`} />
      </div>
      <div className={`${theme.cardClass} brutalist-card animate-fade-in-up`} data-testid="demand-pie-chart">
        <h3 className={`font-heading text-lg font-bold ${theme.textMain} mb-4`}>Customer Demand Insights</h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={demandData} cx="50%" cy="50%" outerRadius={110} innerRadius={50} fill="#8884d8" dataKey="value" paddingAngle={3}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {demandData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: '2px solid rgba(0,0,0,0.1)', boxShadow: '4px 4px 0 rgba(0,0,0,0.05)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OrderManagement() {
  const { inventory, placeOrder } = useSupplyChain();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderQty, setOrderQty] = useState('');

  const available = inventory.filter(i => i.status === 'available' && i.quantity > 0);

  const openOrderDialog = (item) => {
    setSelectedItem(item);
    setOrderQty('');
    setDialogOpen(true);
  };

  const handleOrder = async () => {
    if (!selectedItem || !orderQty) return;
    const qty = parseFloat(orderQty);
    if (qty <= 0 || qty > selectedItem.quantity) return;
    try {
      await placeOrder({
        inventory_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: qty,
        unit: selectedItem.unit,
        total_price: qty * selectedItem.price_per_unit,
        retailer_name: 'Fresh Market Store',
      });
      setDialogOpen(false);
    } catch {}
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Order Management</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Browse available stock and place orders</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {available.length === 0 && (
          <div className={`${theme.cardClass} col-span-full text-center py-12`}>
            <Package className={`w-12 h-12 mx-auto mb-3 ${theme.textMuted}`} />
            <p className={`${theme.textMuted}`}>No stock available right now.</p>
          </div>
        )}
        {available.map((item, i) => (
          <div key={item.id} className={`${theme.cardClass} brutalist-card animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }} data-testid={`order-item-${item.id}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#EA580C]/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#EA580C]" />
              </div>
              <Badge className="border-0 bg-emerald-100 text-emerald-800">{item.quality_grade}</Badge>
            </div>
            <h4 className={`font-heading text-base font-bold ${theme.textMain} mb-1`}>{item.name}</h4>
            <p className={`text-xs ${theme.textMuted} mb-3`}>From {item.farmer_name}</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${theme.textMuted}`}>Available</p>
                <p className={`text-lg font-bold ${theme.textMain}`}>{item.quantity} {item.unit}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${theme.textMuted}`}>Price</p>
                <p className="text-lg font-bold text-[#EA580C]">${item.price_per_unit.toFixed(2)}/{item.unit}</p>
              </div>
            </div>
            <button data-testid={`place-order-btn-${item.id}`} onClick={() => openOrderDialog(item)}
              className={`w-full ${theme.btnPrimary} py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors`}>
              <ShoppingCart className="w-4 h-4" /> Place Order
            </button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="order-dialog">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>Order {selectedItem?.name} from {selectedItem?.farmer_name}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#FFFDF7] rounded-lg border border-black/5">
                <div>
                  <p className="text-sm font-medium">{selectedItem.name}</p>
                  <p className="text-xs text-gray-500">Available: {selectedItem.quantity} {selectedItem.unit}</p>
                </div>
                <p className="text-sm font-bold text-[#EA580C]">${selectedItem.price_per_unit.toFixed(2)}/{selectedItem.unit}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orderQty">Quantity ({selectedItem.unit})</Label>
                <Input data-testid="input-order-qty" id="orderQty" type="number" placeholder={`Max ${selectedItem.quantity}`} value={orderQty} onChange={e => setOrderQty(e.target.value)} />
              </div>
              {orderQty && parseFloat(orderQty) > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-lg font-bold text-[#EA580C]">${(parseFloat(orderQty) * selectedItem.price_per_unit).toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button data-testid="cancel-order-btn" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-black/10 hover:bg-gray-50 transition-colors">Cancel</button>
            <button data-testid="confirm-order-btn" onClick={handleOrder} className={`${theme.btnPrimary} px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}>Confirm Order</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InventoryView() {
  const { orders, inventory } = useSupplyChain();

  const onShelves = orders.filter(o => o.status === 'delivered' || o.status === 'received');
  const inTransit = orders.filter(o => o.status === 'in_transit' || o.status === 'confirmed');
  const pending = orders.filter(o => o.status === 'pending');

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Inventory View</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Track what's on your shelves vs. in transit</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'On Shelves', items: onShelves, icon: PackageOpen, color: 'bg-emerald-100 text-emerald-800' },
          { label: 'In Transit', items: inTransit, icon: Truck, color: 'bg-blue-100 text-blue-800' },
          { label: 'Pending', items: pending, icon: ShoppingCart, color: 'bg-amber-100 text-amber-800' },
        ].map(({ label, items, icon: Icon, color }, i) => (
          <div key={i} className={`${theme.cardClass} brutalist-card animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }} data-testid={`inventory-section-${label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${color.split(' ')[0]}`}>
                <Icon className={`w-4 h-4 ${color.split(' ')[1]}`} />
              </div>
              <h3 className={`font-heading text-base font-bold ${theme.textMain}`}>{label}</h3>
              <Badge className={`ml-auto border-0 ${color}`}>{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.length === 0 && <p className={`text-sm ${theme.textMuted} text-center py-4`}>No items</p>}
              {items.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFFDF7] border border-black/5" data-testid={`inv-order-${order.id}`}>
                  <div>
                    <p className={`text-sm font-medium ${theme.textMain}`}>{order.item_name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>{order.quantity} {order.unit}</p>
                  </div>
                  <Badge className={`border-0 text-xs ${color}`}>{order.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesTracking() {
  const { sales, addSale } = useSupplyChain();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ item_name: '', quantity: '', sale_price: '' });

  const handleSubmit = async () => {
    try {
      await addSale({ ...form, quantity: parseFloat(form.quantity) || 0, sale_price: parseFloat(form.sale_price) || 0 });
      setDialogOpen(false);
      setForm({ item_name: '', quantity: '', sale_price: '' });
    } catch {}
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.sale_price, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Sales Tracking</h2>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>Log and track daily sales</p>
        </div>
        <button data-testid="record-sale-btn" onClick={() => setDialogOpen(true)} className={`${theme.btnPrimary} px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors`}>
          <Plus className="w-4 h-4" /> Record Sale
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className={`${theme.cardClass} brutalist-card`}>
          <p className={`overline ${theme.textMuted} mb-2`}>Total Revenue</p>
          <p className={`font-heading text-3xl font-extrabold tracking-tight ${theme.textMain}`}>${totalRevenue.toLocaleString()}</p>
        </div>
        <div className={`${theme.cardClass} brutalist-card`}>
          <p className={`overline ${theme.textMuted} mb-2`}>Units Sold</p>
          <p className={`font-heading text-3xl font-extrabold tracking-tight ${theme.textMain}`}>{totalUnits}</p>
        </div>
      </div>

      <div className={`${theme.cardClass} brutalist-card !p-0 overflow-hidden`} data-testid="sales-table">
        <Table>
          <TableHeader>
            <TableRow className="border-black/10">
              <TableHead className={theme.textMuted}>Item</TableHead>
              <TableHead className={theme.textMuted}>Quantity</TableHead>
              <TableHead className={theme.textMuted}>Revenue</TableHead>
              <TableHead className={theme.textMuted}>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow><TableCell colSpan={4} className={`text-center py-12 ${theme.textMuted}`}>No sales recorded yet.</TableCell></TableRow>
            ) : sales.map((sale) => (
              <TableRow key={sale.id} className="border-black/5" data-testid={`sale-row-${sale.id}`}>
                <TableCell className={`font-medium ${theme.textMain}`}>{sale.item_name}</TableCell>
                <TableCell className={theme.textMain}>{sale.quantity} {sale.unit}</TableCell>
                <TableCell className="font-semibold text-[#EA580C]">${sale.sale_price.toFixed(2)}</TableCell>
                <TableCell className={theme.textMuted}>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="sale-dialog">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>Log a new sale transaction</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Item Name</Label>
              <Input data-testid="input-sale-item" placeholder="e.g. Tomatoes" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input data-testid="input-sale-qty" type="number" placeholder="e.g. 50" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Sale Price ($)</Label>
                <Input data-testid="input-sale-price" type="number" step="0.01" placeholder="e.g. 250.00" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button data-testid="cancel-sale-btn" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-black/10 hover:bg-gray-50 transition-colors">Cancel</button>
            <button data-testid="save-sale-btn" onClick={handleSubmit} className={`${theme.btnPrimary} px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}>Save Sale</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RetailerDashboard() {
  const { activeTab } = useSupplyChain();
  switch (activeTab) {
    case 'dashboard': return <RetailerOverview />;
    case 'orders': return <OrderManagement />;
    case 'shelves': return <InventoryView />;
    case 'sales': return <SalesTracking />;
    default: return <RetailerOverview />;
  }
}
