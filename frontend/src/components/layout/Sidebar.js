import { useSupplyChain, roleThemes, navConfig } from '@/context/SupplyChainContext';
import {
  LayoutDashboard, Sprout, CalendarDays, Bell, Boxes, Gauge,
  AlertTriangle, ShoppingCart, PackageOpen, Receipt, Wheat,
  Warehouse, Store, User, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const iconMap = {
  LayoutDashboard, Sprout, CalendarDays, Bell, Boxes, Gauge,
  AlertTriangle, ShoppingCart, PackageOpen, Receipt,
};

const roleIcons = { farmer: Wheat, warehouse: Warehouse, retailer: Store };
const roleLabels = { farmer: 'Farmer', warehouse: 'Warehouse', retailer: 'Retailer' };

export default function Sidebar() {
  const { activeRole, setActiveRole, activeTab, setActiveTab } = useSupplyChain();
  const theme = roleThemes[activeRole];
  const navItems = navConfig[activeRole];
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const RoleIcon = roleIcons[activeRole];

  return (
    <aside
      data-testid="sidebar"
      className={`w-64 fixed left-0 top-0 h-screen flex flex-col ${theme.sidebarBg} ${theme.sidebarBorder} z-40`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className={`font-heading text-lg font-extrabold tracking-tight ${theme.textMain}`}>
          SupplyChain
        </h1>
        <p className={`text-xs mt-0.5 ${theme.textMuted}`}>Management System</p>
      </div>

      {/* Role Switcher */}
      <div className="px-4 mb-4">
        <div className="relative">
          <button
            data-testid="role-switcher-dropdown"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${theme.activeBg} ${theme.activeText} font-medium text-sm`}
          >
            <RoleIcon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{roleLabels[activeRole]}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${roleSwitcherOpen ? 'rotate-180' : ''}`} />
          </button>

          {roleSwitcherOpen && (
            <div
              data-testid="role-switcher-menu"
              className={`absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg z-50 ${theme.surfaceBg} border ${theme.border}`}
            >
              {Object.keys(roleLabels).map((role) => {
                const Icon = roleIcons[role];
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    data-testid={`role-switch-${role}`}
                    onClick={() => { setActiveRole(role); setRoleSwitcherOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
                      ${isActive ? `${theme.activeBg} ${theme.activeText} font-semibold` : `${theme.textMuted} hover:${theme.activeBg}`}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{roleLabels[role]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className={`mx-4 border-t ${theme.border} mb-2`} />

      {/* Nav Items */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto" data-testid="sidebar-nav">
        <p className={`overline px-3 pt-3 pb-2 ${theme.textMuted}`}>Navigation</p>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all
                ${isActive
                  ? `${theme.activeBg} ${theme.activeText} font-semibold ${theme.activeBorderL}`
                  : `${theme.textMuted} hover:${theme.activeBg}`
                }`}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Link */}
      <div className={`p-4 border-t ${theme.border}`}>
        <button
          data-testid="nav-profile"
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all
            ${activeTab === 'profile'
              ? `${theme.activeBg} ${theme.activeText} font-semibold`
              : `${theme.textMuted} hover:${theme.activeBg}`
            }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    </aside>
  );
}
