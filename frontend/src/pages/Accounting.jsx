import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Table from '../components/Table';
import { BookOpen, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

const typeColors = {
  saving_deposit: 'active',
  saving_withdrawal: 'inactive',
  loan_disbursement: 'pending',
  loan_repayment: 'active',
  penalty_payment: 'other',
  expense: 'inactive',
  income: 'active',
};

export default function Accounting() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
  const [total, setTotal] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const res = await api.get(`/accounting?${params}`);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [filters]);

  const inflow = transactions
    .filter(t => ['saving_deposit', 'loan_repayment', 'penalty_payment', 'income'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const outflow = transactions
    .filter(t => ['saving_withdrawal', 'loan_disbursement', 'expense'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const columns = [
    { key: 'type', label: 'Type', render: (v) => <span className={`badge badge-${typeColors[v] || 'other'}`}>{v.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', render: (v) => `TZS ${fmt(v)}` },
    { key: 'member', label: 'Member', render: (v) => v?.name || 'System' },
    { key: 'description', label: 'Description' },
    { key: 'recordedBy', label: 'Recorded By', render: (v) => v?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleString() },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Accounting</h1>
          <p>All financial transactions</p>
        </div>
      </div>

      <div className="stats-grid stats-grid-3">
        <div className="stat-card stat-green">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <p className="stat-title">Total Inflow</p>
            <h3 className="stat-value">TZS {fmt(inflow)}</h3>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-info">
            <p className="stat-title">Total Outflow</p>
            <h3 className="stat-value">TZS {fmt(outflow)}</h3>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-info">
            <p className="stat-title">Net Cash Flow</p>
            <h3 className="stat-value">TZS {fmt(inflow - outflow)}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="saving_deposit">Saving Deposit</option>
            <option value="saving_withdrawal">Saving Withdrawal</option>
            <option value="loan_disbursement">Loan Disbursement</option>
            <option value="loan_repayment">Loan Repayment</option>
            <option value="penalty_payment">Penalty Payment</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="filter-date"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="filter-date"
            placeholder="End date"
          />
        </div>
        <p className="table-count">{total} transactions found</p>
        <Table columns={columns} data={transactions} loading={loading} emptyMessage="No transactions found" />
      </div>
    </div>
  );
}
