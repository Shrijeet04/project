import { useState, useEffect } from 'react';
import { useSupplyChain, roleThemes } from '@/context/SupplyChainContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, MapPin, Mail, FileText, Save, Wheat, Warehouse, Store,
} from 'lucide-react';

const roleIcons = { farmer: Wheat, warehouse: Warehouse, retailer: Store };

export default function ProfilePage() {
  const { activeRole, profile, updateProfile } = useSupplyChain();
  const theme = roleThemes[activeRole];
  const [form, setForm] = useState({ role: '', name: '', location: '', contact: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const RoleIcon = roleIcons[activeRole];

  useEffect(() => {
    if (profile) {
      setForm({ role: profile.role, name: profile.name, location: profile.location, contact: profile.contact, bio: profile.bio || '' });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className={`font-heading text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textMain}`}>Profile Settings</h2>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>Manage your account details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className={`${theme.cardClass} flex flex-col items-center text-center`} data-testid="profile-card">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4`} style={{ backgroundColor: `${theme.primary}15` }}>
            <RoleIcon className="w-10 h-10" style={{ color: theme.primary }} />
          </div>
          <h3 className={`font-heading text-xl font-bold ${theme.textMain}`}>{form.name || 'Loading...'}</h3>
          <p className={`overline mt-2 ${theme.textMuted}`}>{activeRole}</p>
          <div className={`mt-4 w-full border-t ${theme.border} pt-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-sm ${theme.textMuted}`}>{form.location || '...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-sm ${theme.textMuted}`}>{form.contact || '...'}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className={`${theme.cardClass} lg:col-span-2`} data-testid="profile-edit-form">
          <h3 className={`font-heading text-lg font-bold ${theme.textMain} mb-6`}>Edit Information</h3>
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label className={theme.textMain}>Name</Label>
              <Input data-testid="input-profile-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={theme.inputBorder} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={theme.textMain}>Location</Label>
                <Input data-testid="input-profile-location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={theme.inputBorder} />
              </div>
              <div className="grid gap-2">
                <Label className={theme.textMain}>Contact</Label>
                <Input data-testid="input-profile-contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className={theme.inputBorder} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className={theme.textMain}>Bio</Label>
              <textarea data-testid="input-profile-bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
                className={`flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 ${theme.inputBorder}`}
              />
            </div>
            <div className="flex justify-end">
              <button data-testid="save-profile-btn" onClick={handleSave} disabled={saving}
                className={`${theme.btnPrimary} px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50`}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
