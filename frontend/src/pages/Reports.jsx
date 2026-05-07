import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  BarChart3, Users, DollarSign, HandCoins,
  Download, Printer, FileSpreadsheet, FileText
} from 'lucide-react';
import {
  exportFinancialPDF, exportFinancialExcel,
  exportMemberPDF, exportMemberExcel,
  exportLoanPDF, exportLoanExcel,
  printReport,
} from '../utils/reportExport';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/* ── Reusable export toolbar ── */
function ExportBar({ onPDF, onExcel, onPrint }) {
  return (
    <div className="export-bar">
      <span className="export-label">Export:</span>
      <button className="btn btn-export" onClick={onPDF} title="Download PDF">
        <FileText size={15} /> PDF
      </button>
      <button className="btn btn-export btn-excel" onClick={onExcel} title="Download Excel">
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button className="btn btn-export btn-print" onClick={onPrint} title="Print">
        <Printer size={15} /> Print
      </button>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financial');
  const [financial, setFinancial] = useState(null);
  const [memberReport, setMemberReport] = useState(null);
  const [loanReport, setLoanReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchFinancial = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(dateRange).filter(([, v]) => v))
      ).toString();
      const res = await api.get(`/reports/financial?${params}`);
      setFinancial(res.data.report);
    } catch { toast.error('Failed to load financial report'); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/members');
      setMemberReport(res.data.report);
    } catch { toast.error('Failed to load member report'); }
    finally { setLoading(false); }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/loans');
      setLoanReport(res.data);
    } catch { toast.error('Failed to load loan report'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'financial') fetchFinancial();
    else if (activeTab === 'members') fetchMembers();
    else if (activeTab === 'loans') fetchLoans();
  }, [activeTab]);

  const loanStatusData = loanReport ? [
    { name: 'Pending', value: loanReport.summary?.pending || 0 },
    { name: 'Active', value: loanReport.summary?.active || 0 },
    { name: 'Completed', value: loanReport.summary?.completed || 0 },
    { name: 'Rejected', value: loanReport.summary?.rejected || 0 },
  ] : [];

  const deposits = financial?.savingsSummary?.find(s => s._id === 'deposit')?.total || 0;
  const withdrawals = financial?.savingsSummary?.find(s => s._id === 'withdrawal')?.total || 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Financial and operational reports — download or print</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {[
          { key: 'financial', label: 'Financial Report', icon: DollarSign },
          { key: 'members', label: 'Member Report', icon: Users },
          { key: 'loans', label: 'Loan Report', icon: HandCoins },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {loading && <div className="page-loading"><div className="spinner" /></div>}

      {/* ══════════════════════════════════
          FINANCIAL REPORT
      ══════════════════════════════════ */}
      {activeTab === 'financial' && financial && !loading && (
        <div className="report-section">
          <ExportBar
            onPDF={() => { exportFinancialPDF(financial); toast.success('PDF downloaded'); }}
            onExcel={() => { exportFinancialExcel(financial); toast.success('Excel downloaded'); }}
            onPrint={() => printReport('Financial Report', 'financial-report-content')}
          />

          {/* Date filter */}
          <div className="report-filter card">
            <span className="filter-label">Filter by date range:</span>
            <input type="date" value={dateRange.startDate}
              onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))}
              className="filter-date" />
            <span>to</span>
            <input type="date" value={dateRange.endDate}
              onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))}
              className="filter-date" />
            <button className="btn btn-primary btn-sm" onClick={fetchFinancial}>Apply</button>
            <button className="btn btn-secondary btn-sm"
              onClick={() => { setDateRange({ startDate: '', endDate: '' }); setTimeout(fetchFinancial, 50); }}>
              Clear
            </button>
          </div>

          {/* Printable content */}
          <div id="financial-report-content">
            <div className="stats-grid">
              <div className="stat-card stat-green">
                <div className="stat-info">
                  <p className="stat-title">Total Deposits</p>
                  <h3 className="stat-value">TZS {fmt(deposits)}</h3>
                  <p className="stat-subtitle">{financial.savingsSummary?.find(s => s._id === 'deposit')?.count || 0} transactions</p>
                </div>
              </div>
              <div className="stat-card stat-red">
                <div className="stat-info">
                  <p className="stat-title">Total Withdrawals</p>
                  <h3 className="stat-value">TZS {fmt(withdrawals)}</h3>
                  <p className="stat-subtitle">{financial.savingsSummary?.find(s => s._id === 'withdrawal')?.count || 0} transactions</p>
                </div>
              </div>
              <div className="stat-card stat-blue">
                <div className="stat-info">
                  <p className="stat-title">Net Savings</p>
                  <h3 className="stat-value">TZS {fmt(deposits - withdrawals)}</h3>
                </div>
              </div>
            </div>

            {/* Loans summary */}
            {financial.loansSummary?.length > 0 && (
              <div className="card mt-4">
                <h3 className="card-title">Loans Summary</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead><tr><th>Status</th><th>Total Amount (TZS)</th><th>Count</th></tr></thead>
                    <tbody>
                      {financial.loansSummary.map(s => (
                        <tr key={s._id}>
                          <td><span className={`badge badge-${s._id}`}>{s._id}</span></td>
                          <td>TZS {fmt(s.total)}</td>
                          <td>{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monthly trend chart */}
            {financial.monthlyTrend?.length > 0 && (
              <div className="card mt-4">
                <h3 className="card-title">Monthly Transaction Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...financial.monthlyTrend].reverse().slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => `TZS ${fmt(v)}`} />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Amount (TZS)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MEMBER REPORT
      ══════════════════════════════════ */}
      {activeTab === 'members' && memberReport && !loading && (
        <div className="report-section">
          <ExportBar
            onPDF={() => { exportMemberPDF(memberReport); toast.success('PDF downloaded'); }}
            onExcel={() => { exportMemberExcel(memberReport); toast.success('Excel downloaded'); }}
            onPrint={() => printReport('Member Report', 'member-report-content')}
          />

          <div id="member-report-content">
            {/* Summary stats */}
            <div className="stats-grid stats-grid-3 mb-4">
              <div className="stat-card stat-blue">
                <div className="stat-info">
                  <p className="stat-title">Total Members</p>
                  <h3 className="stat-value">{memberReport.length}</h3>
                </div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-info">
                  <p className="stat-title">Total Savings</p>
                  <h3 className="stat-value">TZS {fmt(memberReport.reduce((s, r) => s + r.totalSavings, 0))}</h3>
                </div>
              </div>
              <div className="stat-card stat-red">
                <div className="stat-info">
                  <p className="stat-title">Members with Penalties</p>
                  <h3 className="stat-value">{memberReport.filter(r => r.unpaidPenalties > 0).length}</h3>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Member Financial Summary ({memberReport.length} members)</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Total Savings</th>
                      <th>Total Loans</th>
                      <th>Active Loans</th>
                      <th>Unpaid Penalties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberReport.map((r, i) => (
                      <tr key={r.member.id}>
                        <td>{i + 1}</td>
                        <td><strong>{r.member.name}</strong></td>
                        <td>{r.member.email}</td>
                        <td>{r.member.phone || '—'}</td>
                        <td>TZS {fmt(r.totalSavings)}</td>
                        <td>{r.totalLoans}</td>
                        <td>{r.activeLoans}</td>
                        <td>
                          {r.unpaidPenalties > 0
                            ? <span className="badge badge-inactive">{r.unpaidPenalties} unpaid</span>
                            : <span className="badge badge-active">None</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                      <td colSpan={4}>TOTAL</td>
                      <td>TZS {fmt(memberReport.reduce((s, r) => s + r.totalSavings, 0))}</td>
                      <td>{memberReport.reduce((s, r) => s + r.totalLoans, 0)}</td>
                      <td>{memberReport.reduce((s, r) => s + r.activeLoans, 0)}</td>
                      <td>{memberReport.reduce((s, r) => s + r.unpaidPenalties, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          LOAN REPORT
      ══════════════════════════════════ */}
      {activeTab === 'loans' && loanReport && !loading && (
        <div className="report-section">
          <ExportBar
            onPDF={() => { exportLoanPDF(loanReport); toast.success('PDF downloaded'); }}
            onExcel={() => { exportLoanExcel(loanReport); toast.success('Excel downloaded'); }}
            onPrint={() => printReport('Loan Report', 'loan-report-content')}
          />

          <div id="loan-report-content">
            {/* Summary stats */}
            <div className="stats-grid">
              <div className="stat-card stat-blue">
                <div className="stat-info">
                  <p className="stat-title">Total Disbursed</p>
                  <h3 className="stat-value">TZS {fmt(loanReport.summary?.totalDisbursed)}</h3>
                  <p className="stat-subtitle">{loanReport.summary?.active + loanReport.summary?.completed} loans</p>
                </div>
              </div>
              <div className="stat-card stat-green">
                <div className="stat-info">
                  <p className="stat-title">Total Repaid</p>
                  <h3 className="stat-value">TZS {fmt(loanReport.summary?.totalRepaid)}</h3>
                </div>
              </div>
              <div className="stat-card stat-orange">
                <div className="stat-info">
                  <p className="stat-title">Outstanding</p>
                  <h3 className="stat-value">TZS {fmt(loanReport.summary?.totalOutstanding)}</h3>
                  <p className="stat-subtitle">{loanReport.summary?.active} active loans</p>
                </div>
              </div>
              <div className="stat-card stat-red">
                <div className="stat-info">
                  <p className="stat-title">Pending Approval</p>
                  <h3 className="stat-value">{loanReport.summary?.pending}</h3>
                </div>
              </div>
            </div>

            <div className="dashboard-grid mt-4">
              {/* Pie chart */}
              <div className="card">
                <h3 className="card-title">Loan Status Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%" cy="50%"
                      outerRadius={95}
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {loanStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status summary table */}
              <div className="card">
                <h3 className="card-title">Status Summary</h3>
                <table className="data-table">
                  <thead><tr><th>Status</th><th>Count</th></tr></thead>
                  <tbody>
                    {[
                      { label: 'Pending', val: loanReport.summary?.pending, cls: 'pending' },
                      { label: 'Active', val: loanReport.summary?.active, cls: 'active' },
                      { label: 'Completed', val: loanReport.summary?.completed, cls: 'completed' },
                      { label: 'Rejected', val: loanReport.summary?.rejected, cls: 'inactive' },
                    ].map(({ label, val, cls }) => (
                      <tr key={label}>
                        <td><span className={`badge badge-${cls}`}>{label}</span></td>
                        <td><strong>{val || 0}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Loan details table */}
            <div className="card mt-4">
              <h3 className="card-title">All Loans ({loanReport.loans?.length})</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Interest</th>
                      <th>Total Due</th>
                      <th>Repaid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Purpose</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanReport.loans?.map((l, i) => (
                      <tr key={l._id}>
                        <td>{i + 1}</td>
                        <td><strong>{l.member?.name || '—'}</strong></td>
                        <td>TZS {fmt(l.amount)}</td>
                        <td>{l.interestRate}%</td>
                        <td>TZS {fmt(l.totalDue)}</td>
                        <td>TZS {fmt(l.amountRepaid)}</td>
                        <td>TZS {fmt(l.balance)}</td>
                        <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                        <td>{l.purpose || '—'}</td>
                        <td>{l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
