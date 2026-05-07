import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Table from '../components/Table';
import { Shield } from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ module: '', page: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filter.page, limit: 30 });
      if (filter.module) params.append('module', filter.module);
      const res = await api.get(`/audit?${params}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const modules = ['Auth', 'Members', 'Savings', 'Loans', 'Penalties', 'Attendance', 'Settings'];

  const columns = [
    { key: 'user', label: 'User', render: (v) => v ? `${v.name} (${v.role})` : 'System' },
    { key: 'action', label: 'Action', render: (v) => <span className="badge badge-other">{v}</span> },
    { key: 'module', label: 'Module' },
    { key: 'details', label: 'Details', render: (v) => {
      try {
        const parsed = JSON.parse(v);
        return <span className="text-sm text-muted">{JSON.stringify(parsed.body || {}).slice(0, 60)}...</span>;
      } catch { return v || '—'; }
    }},
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'createdAt', label: 'Timestamp', render: (v) => new Date(v).toLocaleString() },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Trail</h1>
          <p>System activity log — {total} total records</p>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <select
            value={filter.module}
            onChange={(e) => setFilter({ ...filter, module: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found" />
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={filter.page <= 1}
            onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </button>
          <span>Page {filter.page}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={logs.length < 30}
            onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
