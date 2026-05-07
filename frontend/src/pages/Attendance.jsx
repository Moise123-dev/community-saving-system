import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { Plus, Eye, CalendarCheck } from 'lucide-react';

export default function Attendance() {
  const { isManager } = useAuth();
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState({ meetingDate: '', meetingTitle: 'Regular Meeting', location: '', notes: '', records: [] });
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance');
      setRecords(res.data.records);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members?isActive=true&role=member');
      const memberList = res.data.members;
      setMembers(memberList);
      setForm(f => ({
        ...f,
        records: memberList.map(m => ({ member: m._id, name: m.name, status: 'present' })),
      }));
    } catch { }
  };

  useEffect(() => {
    fetchRecords();
    if (isManager) fetchMembers();
  }, [isManager]);

  const handleStatusChange = (memberId, status) => {
    setForm(f => ({
      ...f,
      records: f.records.map(r => r.member === memberId ? { ...r, status } : r),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        records: form.records.map(({ member, status }) => ({ member, status })),
      };
      const res = await api.post('/attendance', payload);
      toast.success(res.data.message);
      setShowCreate(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    } finally { setSaving(false); }
  };

  const openView = async (record) => {
    try {
      const res = await api.get(`/attendance/${record._id}`);
      setSelectedRecord(res.data.record);
      setShowView(true);
    } catch { toast.error('Failed to load details'); }
  };

  const columns = [
    { key: 'meetingTitle', label: 'Meeting' },
    { key: 'meetingDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'location', label: 'Location' },
    {
      key: 'records', label: 'Attendance',
      render: (v) => {
        const present = v?.filter(r => r.status === 'present').length || 0;
        const total = v?.length || 0;
        return `${present}/${total} present`;
      }
    },
    { key: 'recordedBy', label: 'Recorded By', render: (v) => v?.name || '—' },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <button className="btn-icon" onClick={() => openView(row)} title="View Details">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  const statusColors = { present: 'active', absent: 'inactive', late: 'pending', excused: 'other' };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p>Meeting attendance records</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => { fetchMembers(); setShowCreate(true); }}>
            <Plus size={18} /> Record Attendance
          </button>
        )}
      </div>

      <div className="card">
        <Table columns={columns} data={records} loading={loading} emptyMessage="No attendance records found" />
      </div>

      {/* Create Attendance Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Record Meeting Attendance" size="lg">
        <form onSubmit={handleCreate} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Meeting Title</label>
              <input type="text" value={form.meetingTitle} onChange={(e) => setForm({ ...form, meetingTitle: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Meeting Date *</label>
              <input type="date" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="attendance-list">
            <h4><CalendarCheck size={16} /> Member Attendance</h4>
            <p className="text-muted text-sm">Absent members will automatically receive a penalty.</p>
            {form.records.map((r) => (
              <div key={r.member} className="attendance-row">
                <span className="member-name">{r.name}</span>
                <div className="status-options">
                  {['present', 'absent', 'late', 'excused'].map((s) => (
                    <label key={s} className={`status-label ${r.status === s ? 'selected ' + s : ''}`}>
                      <input
                        type="radio"
                        name={`status-${r.member}`}
                        value={s}
                        checked={r.status === s}
                        onChange={() => handleStatusChange(r.member, s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Recording...' : 'Record Attendance'}</button>
          </div>
        </form>
      </Modal>

      {/* View Attendance Modal */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Attendance Details" size="lg">
        {selectedRecord && (
          <div>
            <div className="detail-grid">
              <div><span>Meeting</span><strong>{selectedRecord.meetingTitle}</strong></div>
              <div><span>Date</span><strong>{new Date(selectedRecord.meetingDate).toLocaleDateString()}</strong></div>
              <div><span>Location</span><strong>{selectedRecord.location || '—'}</strong></div>
              <div><span>Recorded By</span><strong>{selectedRecord.recordedBy?.name || '—'}</strong></div>
            </div>
            <div className="attendance-summary">
              {selectedRecord.records?.map((r) => (
                <div key={r._id} className="attendance-row view">
                  <span>{r.member?.name}</span>
                  <span className={`badge badge-${statusColors[r.status] || 'other'}`}>{r.status}</span>
                  {r.penaltyApplied && <span className="badge badge-inactive">Penalty Applied</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
