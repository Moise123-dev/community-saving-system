import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { Plus, Search, PiggyBank, TrendingUp, TrendingDown, Eye } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const currentMonth = () => new Date().toISOString().slice(0, 7);

const emptyForm = {
  member: '', amount: '', type: 'deposit',
  month: currentMonth(), notes: '',
  receiptNumber: '', paymentMethod: 'cash', mobileMoneyRef: '',
};

const paymentMethodLabels = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
};

const paymentMethodColors = {
  cash: 'active',
  mobile_money: 'pending',
  bank_transfer: 'other',
  cheque: 'manager',
};

export default function Savings() {
  const { isManager } = useAuth();
  const [savings, setSavings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const endpoint = isManager ? '/savings' : '/savings/my';
      const res = await api.get(endpoint);
      setSavings(isManager ? res.data.savings : res.data.savings);
    } catch { toast.error('Failed to load savings'); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/savings/summary');
      setSummary(res.data);
    } catch { }
  };

  const fetchMembers = async () => {
    if (!isManager) return;
    try {
      const res = await api.get('/members?isActive=true');
      setMembers(res.data.members);
    } catch { }
  };

  useEffect(() => {
    fetchSavings();
    fetchSummary();
    fetchMembers();
  }, [isManager]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/savings', form);
      toast.success('Saving recorded successfully');
      setShowModal(false);
      setForm(emptyForm);
      fetchSavings();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record saving');
    } finally { setSaving(false); }
  };

  const totalDeposits = summary?.summary?.find(s => s._id === 'deposit')?.total || 0;
  const totalWithdrawals = summary?.summary?.find(s => s._id === 'withdrawal')?.total || 0;

  const filtered = savings.filter(s => {
    const matchSearch = !search || s.member?.name?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = !filterMethod || s.paymentMethod === filterMethod;
    return matchSearch && matchMethod;
  });

  const columns = [
    ...(isManager ? [{ key: 'member', label: 'Member', render: (v) => v?.name || '—' }] : []),
    {
      key: 'type', label: 'Type', render: (v) => (
        <span className={`badge badge-${v === 'deposit' ? 'active' : 'inactive'}`}>
          {v === 'deposit' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {v}
        </span>
      ),
    },
    { key: 'amount', label: 'Amount', render: (v) => `TZS ${fmt(v)}` },
    { key: 'month', label: 'Month' },
    {
      key: 'paymentMethod', label: 'Payment Method',
      render: (v) => (
        <span className={`badge badge-${paymentMethodColors[v] || 'other'}`}>
          {paymentMethodLabels[v] || v}
        </span>
      ),
    },
    { key: 'receiptNumber', label: 'Receipt No.', render: (v) => v || '—' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <button className="btn-icon" onClick={() => { setSelectedSaving(row); setShowView(true); }} title="View Details">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Savings</h1>
          <p>{isManager ? 'Manage all member savings' : 'Your savings records'}</p>
        </div>
        {/* Both manager AND member can open the deposit form */}
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus size={18} /> {isManager ? 'Record Saving' : 'Make Deposit'}
        </button>
      </div>

      {isManager && (
        <div className="stats-grid stats-grid-3">
          <div className="stat-card stat-green">
            <div className="stat-icon"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <p className="stat-title">Total Deposits</p>
              <h3 className="stat-value">TZS {fmt(totalDeposits)}</h3>
            </div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-icon"><TrendingDown size={24} /></div>
            <div className="stat-info">
              <p className="stat-title">Total Withdrawals</p>
              <h3 className="stat-value">TZS {fmt(totalWithdrawals)}</h3>
            </div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-icon"><PiggyBank size={24} /></div>
            <div className="stat-info">
              <p className="stat-title">Net Savings</p>
              <h3 className="stat-value">TZS {fmt(totalDeposits - totalWithdrawals)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Member deposit pending notice */}
      {!isManager && (
        <div className="info-notice">
          <PiggyBank size={16} />
          <span>Your deposits are submitted as <strong>pending</strong> and will be approved by the manager.</span>
        </div>
      )}

      <div className="card">
        <div className="table-toolbar">
          {isManager && (
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <select
            className="filter-select"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No savings records found" />
      </div>

      {/* ── Record Saving Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isManager ? 'Record Saving' : 'Make a Deposit'} size="lg">
        <form onSubmit={handleSubmit} className="form">

          <p className="form-section-title">Transaction Details</p>
          {isManager && (
            <div className="form-group">
              <label>Member *</label>
              <select value={form.member} onChange={set('member')} required>
                <option value="">Select member</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-row">
            {/* Only managers can choose withdrawal */}
            {isManager && (
              <div className="form-group">
                <label>Type *</label>
                <select value={form.type} onChange={set('type')}>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Amount (TZS) *</label>
              <input type="number" min="1" value={form.amount} onChange={set('amount')} required />
            </div>
          </div>

          <div className="form-group">
            <label>Month *</label>
            <input type="month" value={form.month} onChange={set('month')} required />
          </div>

          <p className="form-section-title">Payment Details</p>
          <div className="form-row">
            <div className="form-group">
              <label>Payment Method *</label>
              <select value={form.paymentMethod} onChange={set('paymentMethod')}>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Receipt Number</label>
              <input
                type="text"
                value={form.receiptNumber}
                onChange={set('receiptNumber')}
                placeholder="e.g. RCP-2024-001"
              />
            </div>
          </div>

          {form.paymentMethod === 'mobile_money' && (
            <div className="form-group">
              <label>Mobile Money Reference</label>
              <input
                type="text"
                value={form.mobileMoneyRef}
                onChange={set('mobileMoneyRef')}
                placeholder="e.g. M-Pesa / Tigo Pesa transaction ID"
              />
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Record Saving'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Saving Modal ── */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Saving Details">
        {selectedSaving && (
          <div>
            <div className="detail-grid">
              {isManager && (
                <div><span>Member</span><strong>{selectedSaving.member?.name || '—'}</strong></div>
              )}
              <div>
                <span>Type</span>
                <strong>
                  <span className={`badge badge-${selectedSaving.type === 'deposit' ? 'active' : 'inactive'}`}>
                    {selectedSaving.type}
                  </span>
                </strong>
              </div>
              <div><span>Amount</span><strong>TZS {fmt(selectedSaving.amount)}</strong></div>
              <div><span>Month</span><strong>{selectedSaving.month}</strong></div>
              <div>
                <span>Payment Method</span>
                <strong>
                  <span className={`badge badge-${paymentMethodColors[selectedSaving.paymentMethod] || 'other'}`}>
                    {paymentMethodLabels[selectedSaving.paymentMethod] || selectedSaving.paymentMethod}
                  </span>
                </strong>
              </div>
              <div><span>Receipt No.</span><strong>{selectedSaving.receiptNumber || '—'}</strong></div>
              {selectedSaving.paymentMethod === 'mobile_money' && (
                <div><span>Mobile Money Ref</span><strong>{selectedSaving.mobileMoneyRef || '—'}</strong></div>
              )}
              <div>
                <span>Status</span>
                <strong><span className={`badge badge-${selectedSaving.status}`}>{selectedSaving.status}</span></strong>
              </div>
              <div><span>Recorded By</span><strong>{selectedSaving.recordedBy?.name || '—'}</strong></div>
              <div><span>Date</span><strong>{new Date(selectedSaving.createdAt).toLocaleString()}</strong></div>
              {selectedSaving.notes && (
                <div style={{ gridColumn: '1 / -1' }}><span>Notes</span><strong>{selectedSaving.notes}</strong></div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
