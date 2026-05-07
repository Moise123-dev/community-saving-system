import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import {
  Users, PiggyBank, HandCoins, AlertTriangle,
  TrendingUp, Clock, CheckCircle, XCircle,
  CalendarCheck, BookOpen, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

/* ─────────────────────────────────────────
   MANAGER DASHBOARD
───────────────────────────────────────── */
function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/accounting/dashboard'),
      api.get('/accounting/cashflow'),
    ])
      .then(([statsRes, cfRes]) => {
        setStats(statsRes.data.stats);
        // Build monthly bar chart data
        const map = {};
        cfRes.data.cashFlow.forEach(({ _id, total }) => {
          const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
          if (!map[key]) map[key] = { month: key, inflow: 0, outflow: 0 };
          const inTypes = ['saving_deposit', 'loan_repayment', 'penalty_payment', 'income'];
          if (inTypes.includes(_id.type)) map[key].inflow += total;
          else map[key].outflow += total;
        });
        setCashFlow(Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Welcome banner */}
      <div className="welcome-banner manager-banner">
        <div className="welcome-left">
          <div className="welcome-icon"><ShieldCheck size={28} /></div>
          <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Manager Dashboard — Full system overview</p>
          </div>
        </div>
        <span className="badge badge-manager" style={{ fontSize: 13, padding: '4px 12px' }}>Manager</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Members" value={stats?.totalMembers || 0} icon={Users} color="blue" subtitle={`${stats?.activeMembers || 0} active`} />
        <StatCard title="Total Savings" value={`TZS ${fmt(stats?.totalSavings)}`} icon={PiggyBank} color="green" />
        <StatCard title="Active Loans" value={stats?.activeLoans || 0} icon={HandCoins} color="orange" subtitle={`${stats?.pendingLoans || 0} pending approval`} />
        <StatCard title="Unpaid Penalties" value={stats?.unpaidPenalties || 0} icon={AlertTriangle} color="red" subtitle={`TZS ${fmt(stats?.totalPenaltyAmount)}`} />
      </div>

      <div className="dashboard-grid">
        {/* Cash flow chart */}
        <div className="card">
          <h3 className="card-title">Cash Flow (Last 6 Months)</h3>
          {cashFlow.length === 0 ? (
            <p className="empty-text">No transaction data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `TZS ${fmt(v)}`} />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h3 className="card-title">Recent Transactions</h3>
          <div className="transaction-list">
            {!stats?.recentTransactions?.length && <p className="empty-text">No transactions yet</p>}
            {stats?.recentTransactions?.map((t) => (
              <div key={t._id} className="transaction-item">
                <div className="tx-icon">
                  {['saving_deposit', 'loan_repayment', 'penalty_payment'].includes(t.type)
                    ? <CheckCircle size={18} className="text-green" />
                    : <XCircle size={18} className="text-red" />}
                </div>
                <div className="tx-info">
                  <span className="tx-desc">{t.description || t.type.replace(/_/g, ' ')}</span>
                  <span className="tx-member">{t.member?.name || 'System'}</span>
                </div>
                <div className="tx-amount">TZS {fmt(t.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="quick-actions">
        <h3 className="card-title" style={{ marginBottom: 12 }}>Quick Overview</h3>
        <div className="qa-grid">
          <div className="qa-card qa-blue">
            <Users size={22} />
            <div>
              <strong>{stats?.totalMembers || 0}</strong>
              <span>Total Members</span>
            </div>
          </div>
          <div className="qa-card qa-orange">
            <Clock size={22} />
            <div>
              <strong>{stats?.pendingLoans || 0}</strong>
              <span>Loans Awaiting Approval</span>
            </div>
          </div>
          <div className="qa-card qa-green">
            <TrendingUp size={22} />
            <div>
              <strong>TZS {fmt(stats?.totalSavings)}</strong>
              <span>Total Savings Pool</span>
            </div>
          </div>
          <div className="qa-card qa-red">
            <AlertTriangle size={22} />
            <div>
              <strong>TZS {fmt(stats?.totalPenaltyAmount)}</strong>
              <span>Penalties Outstanding</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MEMBER DASHBOARD
───────────────────────────────────────── */
function MemberDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/savings/my'),
      api.get('/loans/my'),
      api.get('/penalties'),
    ])
      .then(([savRes, loanRes, penRes]) => {
        setData({
          totalSavings: savRes.data.totalBalance,
          loans: loanRes.data.loans,
          penalties: penRes.data.penalties,
        });
        setSavings(savRes.data.savings?.slice(0, 5) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const activeLoans = data?.loans?.filter(l => l.status === 'active') || [];
  const pendingLoans = data?.loans?.filter(l => l.status === 'pending') || [];
  const unpaidPenalties = data?.penalties?.filter(p => p.status === 'unpaid') || [];
  const totalLoanBalance = activeLoans.reduce((s, l) => s + (l.balance || 0), 0);
  const totalPenaltyDue = unpaidPenalties.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page">
      {/* Welcome banner */}
      <div className="welcome-banner member-banner">
        <div className="welcome-left">
          <div className="welcome-icon member-icon"><Users size={28} /></div>
          <div>
            <h2>Welcome, {user?.name}</h2>
            <p>Member Dashboard — Your personal account overview</p>
          </div>
        </div>
        <span className="badge badge-member" style={{ fontSize: 13, padding: '4px 12px' }}>Member</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="My Savings Balance" value={`TZS ${fmt(data?.totalSavings)}`} icon={PiggyBank} color="green" subtitle="Total deposited" />
        <StatCard title="Active Loans" value={activeLoans.length} icon={HandCoins} color="orange" subtitle={`TZS ${fmt(totalLoanBalance)} outstanding`} />
        <StatCard title="Pending Loans" value={pendingLoans.length} icon={Clock} color="blue" subtitle="Awaiting approval" />
        <StatCard title="Unpaid Penalties" value={unpaidPenalties.length} icon={AlertTriangle} color="red" subtitle={`TZS ${fmt(totalPenaltyDue)}`} />
      </div>

      {/* ── Action alerts ── */}
      {(activeLoans.length > 0 || unpaidPenalties.length > 0) && (
        <div className="member-action-cards">
          {activeLoans.length > 0 && (
            <div className="action-alert action-loan">
              <div className="action-alert-icon"><HandCoins size={24} /></div>
              <div className="action-alert-info">
                <strong>Loan Repayment Due</strong>
                <p>{activeLoans.length} active {activeLoans.length === 1 ? 'loan' : 'loans'} — TZS {fmt(totalLoanBalance)} outstanding</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/loans')}>
                Pay Now
              </button>
            </div>
          )}
          {unpaidPenalties.length > 0 && (
            <div className="action-alert action-penalty">
              <div className="action-alert-icon"><AlertTriangle size={24} /></div>
              <div className="action-alert-info">
                <strong>Penalties Outstanding</strong>
                <p>{unpaidPenalties.length} unpaid {unpaidPenalties.length === 1 ? 'penalty' : 'penalties'} — TZS {fmt(totalPenaltyDue)} due</p>
              </div>
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                onClick={() => navigate('/app/penalties')}>
                Pay Now
              </button>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Recent savings */}
        <div className="card">
          <h3 className="card-title">Recent Savings</h3>
          {savings.length === 0 ? (
            <p className="empty-text">No savings records yet</p>
          ) : (
            <div className="transaction-list">
              {savings.map((s) => (
                <div key={s._id} className="transaction-item">
                  <div className="tx-icon">
                    {s.type === 'deposit'
                      ? <CheckCircle size={18} className="text-green" />
                      : <XCircle size={18} className="text-red" />}
                  </div>
                  <div className="tx-info">
                    <span className="tx-desc">{s.type === 'deposit' ? 'Deposit' : 'Withdrawal'} — {s.month}</span>
                    <span className="tx-member">{s.paymentMethod?.replace('_', ' ') || 'cash'}</span>
                  </div>
                  <div className="tx-amount" style={{ color: s.type === 'deposit' ? '#10b981' : '#ef4444' }}>
                    {s.type === 'deposit' ? '+' : '-'} TZS {fmt(s.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My loans */}
        <div className="card">
          <h3 className="card-title">My Loans</h3>
          {!data?.loans?.length ? (
            <p className="empty-text">No loans found</p>
          ) : (
            <div className="transaction-list">
              {data.loans.slice(0, 5).map((loan) => (
                <div key={loan._id} className="transaction-item">
                  <div className={`status-dot ${loan.status}`} />
                  <div className="tx-info">
                    <span className="tx-desc">TZS {fmt(loan.amount)} — {loan.purpose || 'General'}</span>
                    <span className="tx-member">
                      Balance: TZS {fmt(loan.balance)} &nbsp;|&nbsp;
                      Due: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <span className={`badge badge-${loan.status}`}>{loan.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT — routes to correct dashboard
───────────────────────────────────────── */
export default function Dashboard() {
  const { isManager } = useAuth();
  return isManager ? <ManagerDashboard /> : <MemberDashboard />;
}
