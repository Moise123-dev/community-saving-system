import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import MobileMoneyPopup from '../components/MobileMoneyPopup';
import {
  Plus, CheckCircle, XCircle, DollarSign, Eye,
  PiggyBank, AlertTriangle, Clock, Receipt,
  Smartphone, Building2, CreditCard
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

/* ── Balance usage bar ── */
function BalanceBar({ used, max }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
  return (
    <div className="balance-bar-wrap">
      <div className="balance-bar-track">
        <div className="balance-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ color }}>{pct.toFixed(0)}% used</span>
    </div>
  );
}

/* ── Payment method selector (reusable) ── */
function PayMethodSelector({ value, onChange, onMobileMoneyClick }) {
  const methods = [
    { value: 'cash', label: 'Cash', icon: <Receipt size={20} /> },
    { value: 'mobile_money', label: 'Mobile Money', icon: <Smartphone size={20} /> },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 size={20} /> },
  ];
  return (
    <div className="pay-method-options">
      {methods.map(m => (
        <label key={m.value} className={`pay-method-card ${value === m.value ? 'selected' : ''}`}>
          <input type="radio" name="loanPayMethod" value={m.value}
            checked={value === m.value}
            onChange={() => {
              onChange(m.value);
              if (m.value === 'mobile_money' && onMobileMoneyClick) onMobileMoneyClick();
            }} />
          {m.icon}
          <span>{m.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function Loans() {
  const { isManager, user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showRequest, setShowRequest] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showRepay, setShowRepay] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showMobileMoney, setShowMobileMoney] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Forms
  const [form, setForm] = useState({ member: '', amount: '', purpose: '', dueDate: '' });
  const [repayForm, setRepayForm] = useState({ amount: '', paymentMethod: 'cash', paymentReference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Eligibility (approval modal)
  const [eligibility, setEligibility] = useState(null);
  const [eligLoading, setEligLoading] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const endpoint = isManager ? `/loans${params}` : '/loans/my';
      const res = await api.get(endpoint);
      setLoans(res.data.loans);
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, [isManager, filterStatus]);

  useEffect(() => {
    if (isManager) {
      api.get('/members?isActive=true').then(r => setMembers(r.data.members)).catch(() => {});
    }
  }, [isManager]);

  // Open repay modal
  const openRepay = (loan) => {
    setSelectedLoan(loan);
    setRepayForm({ amount: '', paymentMethod: 'cash', paymentReference: '', notes: '' });
    setShowRepay(true);
  };

  // Open approval modal — fetch eligibility
  const openApprove = async (loan) => {
    setSelectedLoan(loan);
    setEligibility(null);
    setShowApprove(true);
    setEligLoading(true);
    try {
      const res = await api.get(`/loans/eligibility/${loan.member._id}`);
      setEligibility(res.data.eligibility);
    } catch { toast.error('Could not load member balance'); }
    finally { setEligLoading(false); }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/loans', form);
      toast.success('Loan request submitted — awaiting manager approval');
      setShowRequest(false);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit loan request');
    } finally { setSaving(false); }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/loans/${selectedLoan._id}/approve`);
      toast.success(res.data.message);
      setShowApprove(false);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setSaving(false); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this loan request?')) return;
    try {
      await api.put(`/loans/${id}/reject`);
      toast.success('Loan rejected');
      fetchLoans();
    } catch { toast.error('Failed to reject'); }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post(`/loans/${selectedLoan._id}/repay`, repayForm);
      toast.success(res.data.message);
      setShowRepay(false);
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Repayment failed');
    } finally { setSaving(false); }
  };

  const canApprove = eligibility && selectedLoan
    ? selectedLoan.amount <= eligibility.availableCredit
    : false;

  const pendingCount = loans.filter(l => l.status === 'pending').length;
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalBalance = activeLoans.reduce((s, l) => s + (l.balance || 0), 0);

  const columns = [
    ...(isManager ? [{ key: 'member', label: 'Member', render: (v) => v?.name || '—' }] : []),
    { key: 'amount', label: 'Requested', render: (v) => `TZS ${fmt(v)}` },
    { key: 'interestRate', label: 'Interest', render: (v) => `${v}%` },
    { key: 'totalDue', label: 'Total Due', render: (v) => `TZS ${fmt(v)}` },
    { key: 'amountRepaid', label: 'Repaid', render: (v) => `TZS ${fmt(v)}` },
    {
      key: 'balance', label: 'Balance',
      render: (v) => (
        <span style={{ color: v > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
          TZS {fmt(v)}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'dueDate', label: 'Due Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="action-btns">
          <button className="btn-icon" title="View Details"
            onClick={() => { setSelectedLoan(row); setShowView(true); }}>
            <Eye size={16} />
          </button>

          {/* Manager: approve/reject pending */}
          {isManager && row.status === 'pending' && (
            <>
              <button className="btn-icon success" title="Review & Approve" onClick={() => openApprove(row)}>
                <CheckCircle size={16} />
              </button>
              <button className="btn-icon danger" title="Reject" onClick={() => handleReject(row._id)}>
                <XCircle size={16} />
              </button>
            </>
          )}

          {/* BOTH roles: repay active loans */}
          {row.status === 'active' && (
            <button className="btn-icon" title="Make Repayment" onClick={() => openRepay(row)}
              style={{ color: '#2563eb', borderColor: '#2563eb' }}>
              <CreditCard size={16} />
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
          <h1>Loans</h1>
          <p>{isManager ? 'Manage all loan requests' : 'Your loans'}</p>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setForm({ member: user._id, amount: '', purpose: '', dueDate: '' }); setShowRequest(true); }}>
          <Plus size={18} /> Request Loan
        </button>
      </div>

      {/* Manager: pending alert */}
      {isManager && pendingCount > 0 && (
        <div className="pending-alert">
          <Clock size={18} />
          <span><strong>{pendingCount} loan {pendingCount === 1 ? 'request' : 'requests'}</strong> pending your review</span>
        </div>
      )}

      {/* Member: active loan balance alert */}
      {!isManager && activeLoans.length > 0 && (
        <div className="info-notice" style={{ marginBottom: 16 }}>
          <CreditCard size={16} />
          <span>
            You have <strong>{activeLoans.length} active {activeLoans.length === 1 ? 'loan' : 'loans'}</strong> with
            total outstanding balance of <strong>TZS {fmt(totalBalance)}</strong>.
            Click the 💳 button to make a repayment.
          </span>
        </div>
      )}

      <div className="card">
        {isManager && (
          <div className="table-toolbar">
            <div className="filter-tabs">
              {['', 'pending', 'active', 'completed', 'rejected'].map(s => (
                <button key={s}
                  className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                  onClick={() => setFilterStatus(s)}>
                  {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
        <Table columns={columns} data={loans} loading={loading} emptyMessage="No loans found" />
      </div>

      {/* ── Request Loan Modal ── */}
      <Modal isOpen={showRequest} onClose={() => setShowRequest(false)} title="Request a Loan">
        <form onSubmit={handleRequest} className="form">
          {isManager && (
            <div className="form-group">
              <label>Member *</label>
              <select value={form.member} onChange={e => setForm({ ...form, member: e.target.value })} required>
                <option value="">Select member</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Loan Amount (TZS) *</label>
            <input type="number" min="1" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Purpose</label>
            <input type="text" value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              placeholder="Reason for loan" />
          </div>
          <div className="form-group">
            <label>Preferred Due Date</label>
            <input type="date" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="info-notice">
            <Clock size={15} />
            <span>Your request will be reviewed by the manager based on your savings balance.</span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowRequest(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Repayment Modal (both roles) ── */}
      <Modal isOpen={showRepay} onClose={() => setShowRepay(false)} title="Make Loan Repayment" size="lg">
        {selectedLoan && (
          <>
            {/* Loan summary */}
            <div className="repay-summary">
              {isManager && (
                <div className="rs-row">
                  <span>Member</span>
                  <strong>{selectedLoan.member?.name}</strong>
                </div>
              )}
              <div className="rs-row">
                <span>Original Amount</span>
                <strong>TZS {fmt(selectedLoan.amount)}</strong>
              </div>
              <div className="rs-row">
                <span>Total Due (with interest)</span>
                <strong>TZS {fmt(selectedLoan.totalDue)}</strong>
              </div>
              <div className="rs-row">
                <span>Already Repaid</span>
                <strong className="text-green">TZS {fmt(selectedLoan.amountRepaid)}</strong>
              </div>
              <div className="rs-balance">
                <span>Outstanding Balance</span>
                <strong>TZS {fmt(selectedLoan.balance)}</strong>
              </div>
              {/* Repayment progress */}
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Repayment progress</p>
                <BalanceBar used={selectedLoan.amountRepaid} max={selectedLoan.totalDue} />
              </div>
            </div>

            <form onSubmit={handleRepay} className="form" style={{ marginTop: 16 }}>
              <p className="form-section-title">Payment Details</p>

              <div className="form-group">
                <label>Repayment Amount (TZS) *</label>
                <input
                  type="number" min="1" max={selectedLoan.balance}
                  value={repayForm.amount}
                  onChange={e => setRepayForm({ ...repayForm, amount: e.target.value })}
                  placeholder={`Max: TZS ${fmt(selectedLoan.balance)}`}
                  required
                />
                {/* Quick fill buttons */}
                <div className="quick-fill-btns">
                  {[0.25, 0.5, 1].map(pct => (
                    <button key={pct} type="button" className="btn btn-secondary btn-sm"
                      onClick={() => setRepayForm({ ...repayForm, amount: Math.floor(selectedLoan.balance * pct) })}>
                      {pct === 1 ? 'Full' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <PayMethodSelector
                  value={repayForm.paymentMethod}
                  onChange={v => setRepayForm({ ...repayForm, paymentMethod: v, paymentReference: '' })}
                  onMobileMoneyClick={() => setShowMobileMoney(true)}
                />
              </div>

              {repayForm.paymentMethod !== 'cash' && (
                <div className="form-group">
                  <label>
                    {repayForm.paymentMethod === 'mobile_money'
                      ? 'Mobile Money Transaction ID *'
                      : 'Bank Reference / Slip No. *'}
                  </label>
                  <input
                    type="text"
                    value={repayForm.paymentReference}
                    onChange={e => setRepayForm({ ...repayForm, paymentReference: e.target.value })}
                    placeholder={repayForm.paymentMethod === 'mobile_money' ? 'e.g. ABC123456' : 'e.g. TXN-2025-001'}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea value={repayForm.notes}
                  onChange={e => setRepayForm({ ...repayForm, notes: e.target.value })}
                  rows={2} placeholder="Any additional notes..." />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRepay(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner-sm" /> : <CreditCard size={16} />}
                  {saving ? 'Processing...' : repayForm.amount ? `Pay TZS ${fmt(repayForm.amount)}` : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* ── Approval Modal (manager only) ── */}
      <Modal isOpen={showApprove} onClose={() => setShowApprove(false)} title="Review Loan Request" size="lg">
        {selectedLoan && (
          <div className="approval-modal">
            <div className="approval-loan-header">
              <div>
                <p className="text-muted" style={{ fontSize: 12 }}>Member</p>
                <strong style={{ fontSize: 16 }}>{selectedLoan.member?.name}</strong>
                <p className="text-muted" style={{ fontSize: 12 }}>{selectedLoan.member?.email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="text-muted" style={{ fontSize: 12 }}>Requested Amount</p>
                <strong style={{ fontSize: 22, color: '#1d4ed8' }}>TZS {fmt(selectedLoan.amount)}</strong>
                <p className="text-muted" style={{ fontSize: 12 }}>
                  Total due: TZS {fmt(selectedLoan.totalDue)} ({selectedLoan.interestRate}% interest)
                </p>
              </div>
            </div>

            {selectedLoan.purpose && (
              <div className="approval-purpose">
                <span>Purpose:</span> {selectedLoan.purpose}
              </div>
            )}

            <div className="eligibility-panel">
              <h4><PiggyBank size={16} /> Member Savings & Eligibility</h4>
              {eligLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                  <div className="spinner" style={{ width: 20, height: 20 }} />
                  <span className="text-muted">Loading balance...</span>
                </div>
              ) : eligibility ? (
                <>
                  <div className="elig-grid">
                    <div className="elig-item">
                      <span>Savings Balance</span>
                      <strong className="text-green">TZS {fmt(eligibility.savingsBalance)}</strong>
                    </div>
                    <div className="elig-item">
                      <span>Loan Multiplier</span>
                      <strong>{eligibility.multiplier}×</strong>
                    </div>
                    <div className="elig-item">
                      <span>Max Eligible Loan</span>
                      <strong>TZS {fmt(eligibility.maxLoanAmount)}</strong>
                    </div>
                    <div className="elig-item">
                      <span>Existing Loan Balance</span>
                      <strong className={eligibility.existingLoanBalance > 0 ? 'text-orange' : ''}>
                        TZS {fmt(eligibility.existingLoanBalance)}
                      </strong>
                    </div>
                    <div className="elig-item elig-highlight">
                      <span>Available Credit</span>
                      <strong className={eligibility.availableCredit >= selectedLoan.amount ? 'text-green' : 'text-red'}>
                        TZS {fmt(eligibility.availableCredit)}
                      </strong>
                    </div>
                    <div className="elig-item elig-highlight">
                      <span>Requested Amount</span>
                      <strong style={{ color: '#1d4ed8' }}>TZS {fmt(selectedLoan.amount)}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Credit usage after this loan</p>
                    <BalanceBar
                      used={eligibility.existingLoanBalance + selectedLoan.amount}
                      max={eligibility.maxLoanAmount}
                    />
                  </div>
                  {canApprove ? (
                    <div className="elig-ok">
                      <CheckCircle size={18} />
                      <div>
                        <strong>Eligible for approval</strong>
                        <p>Requested TZS {fmt(selectedLoan.amount)} is within available credit of TZS {fmt(eligibility.availableCredit)}.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="elig-fail">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Insufficient savings balance</strong>
                        <p>
                          Requested TZS {fmt(selectedLoan.amount)} exceeds available credit of TZS {fmt(eligibility.availableCredit)}.
                          Member needs TZS {fmt(selectedLoan.amount - eligibility.availableCredit)} more in savings.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted">Could not load eligibility data.</p>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowApprove(false)}>Cancel</button>
              <button className="btn btn-danger-outline"
                onClick={() => { setShowApprove(false); handleReject(selectedLoan._id); }}>
                <XCircle size={16} /> Reject
              </button>
              <button className="btn btn-primary"
                onClick={handleApprove}
                disabled={saving || eligLoading || !canApprove}
                title={!canApprove ? 'Member does not have sufficient savings balance' : ''}>
                {saving ? <span className="spinner-sm" /> : <CheckCircle size={16} />}
                {saving ? 'Approving...' : 'Approve Loan'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── View Loan Modal ── */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Loan Details" size="lg">
        {selectedLoan && (
          <div className="loan-detail">
            <div className="detail-grid">
              <div><span>Member</span><strong>{selectedLoan.member?.name}</strong></div>
              <div><span>Amount</span><strong>TZS {fmt(selectedLoan.amount)}</strong></div>
              <div><span>Interest Rate</span><strong>{selectedLoan.interestRate}%</strong></div>
              <div><span>Total Due</span><strong>TZS {fmt(selectedLoan.totalDue)}</strong></div>
              <div><span>Amount Repaid</span><strong className="text-green">TZS {fmt(selectedLoan.amountRepaid)}</strong></div>
              <div><span>Balance</span>
                <strong style={{ color: selectedLoan.balance > 0 ? '#ef4444' : '#10b981' }}>
                  TZS {fmt(selectedLoan.balance)}
                </strong>
              </div>
              <div><span>Status</span>
                <strong><span className={`badge badge-${selectedLoan.status}`}>{selectedLoan.status}</span></strong>
              </div>
              <div><span>Purpose</span><strong>{selectedLoan.purpose || '—'}</strong></div>
              <div><span>Request Date</span>
                <strong>{new Date(selectedLoan.requestDate || selectedLoan.createdAt).toLocaleDateString()}</strong>
              </div>
              <div><span>Due Date</span>
                <strong>{selectedLoan.dueDate ? new Date(selectedLoan.dueDate).toLocaleDateString() : '—'}</strong>
              </div>
              {selectedLoan.approvedBy && (
                <div><span>Approved By</span><strong>{selectedLoan.approvedBy?.name || '—'}</strong></div>
              )}
            </div>

            {/* Repayment progress bar */}
            {selectedLoan.totalDue > 0 && (
              <div style={{ margin: '16px 0 8px' }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Repayment progress</p>
                <BalanceBar used={selectedLoan.amountRepaid} max={selectedLoan.totalDue} />
              </div>
            )}

            {selectedLoan.repayments?.length > 0 && (
              <div className="repayment-history">
                <h4>Repayment History ({selectedLoan.repayments.length} payments)</h4>
                {selectedLoan.repayments.map((r, i) => (
                  <div key={i} className="repayment-item">
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>TZS {fmt(r.amount)}</span>
                    <span className="text-muted">{r.paymentMethod?.replace('_', ' ') || 'cash'}</span>
                    {r.paymentReference && <span className="text-muted">Ref: {r.paymentReference}</span>}
                    <span className="text-muted">{r.notes || ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick repay button from view modal */}
            {selectedLoan.status === 'active' && (
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-primary"
                  onClick={() => { setShowView(false); openRepay(selectedLoan); }}>
                  <CreditCard size={16} /> Make a Repayment
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Mobile Money Popup ── */}
      <MobileMoneyPopup
        isOpen={showMobileMoney}
        onClose={() => setShowMobileMoney(false)}
        amount={repayForm.amount || selectedLoan?.balance || 0}
        saving={saving}
        onConfirm={({ phone, network, txId }) => {
          setRepayForm(f => ({
            ...f,
            paymentReference: txId,
            notes: f.notes || `Mobile Money: ${phone} (${network})`,
          }));
          setShowMobileMoney(false);
          toast.success('Mobile Money details saved!');
        }}
      />
    </div>
  );
}
