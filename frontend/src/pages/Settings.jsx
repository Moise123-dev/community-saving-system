import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';

const settingLabels = {
  contribution_amount: { label: 'Monthly Contribution Amount', type: 'number', unit: 'TZS' },
  interest_rate: { label: 'Loan Interest Rate', type: 'number', unit: '%' },
  absence_penalty: { label: 'Absence Penalty Amount', type: 'number', unit: 'TZS' },
  late_payment_penalty: { label: 'Late Payment Penalty', type: 'number', unit: 'TZS' },
  max_loan_multiplier: { label: 'Max Loan Multiplier (× savings)', type: 'number', unit: 'x' },
  group_name: { label: 'Group Name', type: 'text', unit: '' },
  currency: { label: 'Currency', type: 'text', unit: '' },
};

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings);
      const vals = {};
      res.data.settings.forEach(s => { vals[s.key] = s.value; });
      setValues(vals);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const initSettings = async () => {
    try {
      await api.post('/settings/init');
      toast.success('Settings initialized with defaults');
      fetchSettings();
    } catch { toast.error('Failed to initialize settings'); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await api.put(`/settings/${key}`, { value: values[key] });
      toast.success(`${settingLabels[key]?.label || key} updated`);
    } catch { toast.error('Failed to update setting'); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure system parameters</p>
        </div>
        <button className="btn btn-secondary" onClick={initSettings}>
          <RefreshCw size={16} /> Reset to Defaults
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="card empty-state">
          <SettingsIcon size={48} className="text-muted" />
          <p>No settings found.</p>
          <button className="btn btn-primary" onClick={initSettings}>Initialize Settings</button>
        </div>
      ) : (
        <div className="settings-grid">
          {settings.map((s) => {
            const meta = settingLabels[s.key] || { label: s.key, type: 'text', unit: '' };
            return (
              <div key={s.key} className="setting-card">
                <div className="setting-info">
                  <h4>{meta.label}</h4>
                  <p className="text-muted">{s.description}</p>
                </div>
                <div className="setting-control">
                  <div className="input-with-unit">
                    <input
                      type={meta.type}
                      value={values[s.key] ?? ''}
                      onChange={(e) => setValues(v => ({ ...v, [s.key]: meta.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      min={meta.type === 'number' ? 0 : undefined}
                    />
                    {meta.unit && <span className="unit">{meta.unit}</span>}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSave(s.key)}
                    disabled={saving[s.key]}
                  >
                    {saving[s.key] ? '...' : <><Save size={14} /> Save</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
