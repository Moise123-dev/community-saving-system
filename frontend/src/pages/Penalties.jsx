import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import {
  Plus, CheckCircle, Trash2, AlertTriangle,
  CreditCard, Smartphone, Building2, Receipt
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

const typeColors = {
  absence: 'other',
  late_payment: 'pending',
  misconduct: 'inactive',
  other: 'manager',
};

const payMethodIcons = {
  cash: <Receipt size={15} />,
  mobile_money: <Smartphone size={15} />,
  bank_transfer: <Building2 size={15} />,
};

export default function Penalties() {
  const { isManager } = useAuth();
  const [penalties, setPenalties] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Assign modal (manager)
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ member: '', amount: '', reason: '', type: 'other', notes: '' });

  // Pay modal (member + manager)
  const [showPay, setShowPay] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'cash', paymentReference: '', notes: '' });

  const [saving, setSaving] = useState(false);

  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/penalties${params}`);
      setPenalties(res.data.penalties);
    } catch { toast.error('Failed to load penalties'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPenalties();
    if (isManager) {
      api.get('/members?isActive=true').then(r => setMembers(r.data.members)).catch(() => {});
    }
  }, [isManager, filter]);

  // ── Assign penalty (manager) ──
  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/penalties', assignForm);
      toast.success('Penalty assigned successfully');
      setShowAssign(false);
      setAssignForm({ member: '', amount: '', reason: '', type: 'other', notes: '' });
      fetchPenalties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign penalty');
    } finally { setSaving(false); }
  };

  // ── Open pay modal ──
  const openPay = (penalty) => {
    setSelectedPenalty(penalty);
    setPayForm({ paymentMethod: 'cash', paymentReference: '', notes: '' });
    setShowPay(true);
  };

  // ── Pay penalty ──
  const handlePay = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/penalties/${selectedPenalty._id}/pay`, payForm);
      toast.success('Penalty paid successfully!');
      setShowPay(false);
      fetchPenalties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setSaving(false); }
  };

  // ── Delete (manager) ──
  const handleDelete = async (id) => {
    if (!confirm('Delete this penalty?')) return;
    try {
      await api.delete(`/penalties/${id}`);
      toast.success('Penalty deleted');
      fetchPenalties();
    } catch { toast.error('Failed to delete'); }
  };

  // Summary counts
  const unpaidPenalties = penalties.filter(p => p.status === 'unpaid');
  const totalUnpaid = unpaidPenalties.reduce((s, p) => s + p.amount, 0);

  const columns = [
    ...(isManager ? [{ key: 'member', label: 'Member', render: (v) => v?.name || '—' }] : []),
    { key: 'reason', label: 'Reason' },
    {
      key: 'type', label: 'Type',
      render: (v) => <span className={`badge badge-${typeColors[v] || 'other'}`}>{v.replace('_', ' ')}</span>,
    },
    { key: 'amount', label: 'Amount', render: (v) => `TZS ${fmt(v)}` },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span className={`badge badge-${v === 'paid' ? 'active' : 'inactive'}`}>
          {v === 'paid' ? <CheckCircle size={11} /> : <AlertTriangle size={11} />} {v}
        </span>
      ),
    },
    {
      key: 'paymentMethod', label: 'Paid Via',
      render: (v, row) => row.status === 'paid'
        ? <span className="pay-method-badge">{payMethodIcons[v] || <Receipt size={15} />} {v?.replace('_', ' ') || 'cash'}</span>
        : '—',
    },
    { key: 'paidDate', label: 'Paid Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'createdAt', label: 'Issued', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="action-btns">
          {row.status === 'unpaid' && (
            <button
              className="btn-icon success"
              onClick={() => openPay(row)}
              title={isManager ? 'Mark as Paid' : 'Pay this penalty'}
            >
              <CreditCard size={16} />
            </button>
          )}
          {isManager && (
            <button className="btn-icon danger" onClick={() => handleDelete(row._id)} title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Penalties</h1>
          <p>{isManager ? 'Manage member penalties' : 'Your penalties'}</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
            <Plus size={18} /> Assign Penalty
          </button>
        )}
      </div>

      {/* Unpaid alert — shown to both roles */}
      {unpaidPenalties.length > 0 && (
        <div className="penalty-alert">
          <AlertTriangle size={20} />
          <div>
            <strong>
              {isManager
                ? `${unpaidPenalties.length} unpaid ${unpaidPenalties.length === 1 ? 'penalty' : 'penalties'} across members`
                : `You have ${unpaidPenalties.length} unpaid ${unpaidPenalties.length === 1 ? 'penalty' : 'penalties'}`}
            </strong>
            <p>Total outstanding: TZS {fmt(totalUnpaid)}
              {!isManager && ' — Click the pay button to settle your penalties'}
            </p>
          </div>
          {!isManager && unpaidPenalties.length === 1 && (
            <button className="btn btn-primary btn-sm" onClick={() => openPay(unpaidPenalties[0])}>
              Pay Now
            </button>
          )}
        </div>
      )}

      <div className="card">
        <div className="table-toolbar">
          <div className="filter-tabs">
            {['', 'unpaid', 'paid'].map((s) => (
              <button
                key={s}
                className={`filter-tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === '' ? `All (${penalties.length})` : s === 'unpaid' ? `Unpaid (${unpaidPenalties.length})` : 'Paid'}
              </button>
            ))}
          </div>
        </div>
        <Table columns={columns} data={penalties} loading={loading} emptyMessage="No penalties found" />
      </div>

      {/* ── Assign Penalty Modal (manager only) ── */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Penalty">
        <form onSubmit={handleAssign} className="form">
          <div className="form-group">
            <label>Member *</label>
            <select value={assignForm.member}
              onChange={e => setAssignForm({ ...assignForm, member: e.target.value })} required>
              <option value="">Select member</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select value={assignForm.type}
                onChange={e => setAssignForm({ ...assignForm, type: e.target.value })}>
                <option value="absence">Absence</option>
                <option value="late_payment">Late Payment</option>
                <option value="misconduct">Misconduct</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount (TZS) *</label>
              <input type="number" min="0" value={assignForm.amount}
                onChange={e => setAssignForm({ ...assignForm, amount: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Reason *</label>
            <input type="text" value={assignForm.reason}
              onChange={e => setAssignForm({ ...assignForm, reason: e.target.value })} required
              placeholder="e.g. Absent from meeting on 01/01/2025" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={assignForm.notes}
              onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} rows={2} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Assign Penalty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Pay Penalty Modal (both roles) ── */}
      <Modal isOpen={showPay} onClose={() => setShowPay(false)} title="Pay Penalty">
        {selectedPenalty && (
          <>
            {/* Penalty summary card */}
            <div className="penalty-pay-summary">
              <div className="pps-row">
                <span>Reason</span>
                <strong>{selectedPenalty.reason}</strong>
              </div>
              <div className="pps-row">
                <span>Type</span>
                <span className={`badge badge-${typeColors[selectedPenalty.type] || 'other'}`}>
                  {selectedPenalty.type.replace('_', ' ')}
                </span>
              </div>
              <div className="pps-row">
                <span>Issued</span>
                <strong>{new Date(selectedPenalty.createdAt).toLocaleDateString()}</strong>
              </div>
              {isManager && (
                <div className="pps-row">
                  <span>Member</span>
                  <strong>{selectedPenalty.member?.name}</strong>
                </div>
              )}
              <div className="pps-amount">
                <span>Amount Due</span>
                <strong>TZS {fmt(selectedPenalty.amount)}</strong>
              </div>
            </div>

            <form onSubmit={handlePay} className="form" style={{ marginTop: 16 }}>
              <p className="form-section-title">Payment Details</p>

              {/* Payment method selector */}
              <div className="form-group">
                <label>Payment Method *</label>
                <div className="pay-method-options">
                  {[
                    { value: 'cash', label: 'Cash', icon: <Receipt size={20} /> },
                    { value: 'mobile_money', label: 'Mobile Money', icon: <Smartphone size={20} /> },
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 size={20} /> },
                  ].map(({ value, label, icon }) => (
                    <label
                      key={value}
                      className={`pay-method-card ${payForm.paymentMethod === value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={value}
                        checked={payForm.paymentMethod === value}
                        onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value, paymentReference: '' })}
                      />
                      {icon}
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference field for non-cash */}
              {payForm.paymentMethod !== 'cash' && (
                <div className="form-group">
                  <label>
                    {payForm.paymentMethod === 'mobile_money' ? 'Mobile Money Transaction ID' : 'Bank Reference / Slip No.'}
                  </label>
                  <input
                    type="text"
                    value={payForm.paymentReference}
                    onChange={e => setPayForm({ ...payForm, paymentReference: e.target.value })}
                    placeholder={payForm.paymentMethod === 'mobile_money' ? 'e.g. ABC123456' : 'e.g. TXN-2025-001'}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={payForm.notes}
                  onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPay(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner-sm" /> : <CheckCircle size={16} />}
                  {saving ? 'Processing...' : `Pay TZS ${fmt(selectedPenalty.amount)}`}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
