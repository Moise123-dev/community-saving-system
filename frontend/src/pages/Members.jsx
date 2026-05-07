import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { UserPlus, Search, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';

const emptyForm = {
  name: '', email: '', password: '', phone: '', role: 'member',
  nationalId: '', address: '', occupation: '',
  emergencyContact: '', emergencyPhone: '',
  nextOfKin: '', nextOfKinPhone: '', nextOfKinRelationship: '',
};

export default function Members() {
  const { isManager } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/members?search=${search}`);
      setMembers(res.data.members);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [search]);

  const openCreate = () => { setEditMember(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ ...emptyForm, ...m, password: '' }); setShowModal(true); };

  const openView = async (m) => {
    setViewMember(m);
    try {
      const res = await api.get(`/members/${m._id}/summary`);
      setSummary(res.data.summary);
    } catch { setSummary(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMember) {
        await api.put(`/members/${editMember._id}`, form);
        toast.success('Member updated');
      } else {
        await api.post('/members', form);
        toast.success('Member created');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this member?')) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deactivated');
      fetchMembers();
    } catch { toast.error('Failed to deactivate'); }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const fmt = (n) => new Intl.NumberFormat().format(n || 0);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'occupation', label: 'Occupation', render: (v) => v || '—' },
    { key: 'role', label: 'Role', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    {
      key: 'isActive', label: 'Status',
      render: (v) => v
        ? <span className="badge badge-active"><UserCheck size={12} /> Active</span>
        : <span className="badge badge-inactive"><UserX size={12} /> Inactive</span>,
    },
    { key: 'joinDate', label: 'Joined', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="action-btns">
          <button className="btn-icon" onClick={() => openView(row)} title="View"><Eye size={16} /></button>
          {isManager && <button className="btn-icon" onClick={() => openEdit(row)} title="Edit"><Edit size={16} /></button>}
          {isManager && row.isActive && (
            <button className="btn-icon danger" onClick={() => handleDeactivate(row._id)} title="Deactivate">
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
          <h1>Members</h1>
          <p>Manage group members</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={18} /> Add Member
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table columns={columns} data={members} loading={loading} emptyMessage="No members found" />
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMember ? 'Edit Member' : 'Add New Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="form">

          {/* ── Basic Info ── */}
          <p className="form-section-title">Basic Information</p>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="form-row">
            {!editMember && (
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Default: Password@123" />
              </div>
            )}
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+255 700 000 000" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Occupation</label>
              <input type="text" value={form.occupation} onChange={set('occupation')} placeholder="e.g. Teacher, Farmer" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={set('role')}>
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>National ID</label>
              <input type="text" value={form.nationalId} onChange={set('nationalId')} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={form.address} onChange={set('address')} />
            </div>
          </div>

          {/* ── Emergency Contact ── */}
          <p className="form-section-title">Emergency Contact</p>
          <div className="form-row">
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input type="text" value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input type="tel" value={form.emergencyPhone} onChange={set('emergencyPhone')} placeholder="+255 700 000 000" />
            </div>
          </div>

          {/* ── Next of Kin ── */}
          <p className="form-section-title">Next of Kin</p>
          <div className="form-row">
            <div className="form-group">
              <label>Next of Kin Name</label>
              <input type="text" value={form.nextOfKin} onChange={set('nextOfKin')} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <select value={form.nextOfKinRelationship} onChange={set('nextOfKinRelationship')}>
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="relative">Other Relative</option>
                <option value="friend">Friend</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Next of Kin Phone</label>
              <input type="tel" value={form.nextOfKinPhone} onChange={set('nextOfKinPhone')} placeholder="+255 700 000 000" />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editMember ? 'Update Member' : 'Create Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Member Modal ── */}
      <Modal
        isOpen={!!viewMember}
        onClose={() => { setViewMember(null); setSummary(null); }}
        title="Member Details"
        size="lg"
      >
        {viewMember && (
          <div className="member-detail">
            <div className="member-avatar-lg">{viewMember.name?.charAt(0).toUpperCase()}</div>
            <h3>{viewMember.name}</h3>
            <p className="text-muted">{viewMember.email}</p>

            <p className="form-section-title" style={{ textAlign: 'left', marginTop: 20 }}>Basic Information</p>
            <div className="detail-grid">
              <div><span>Phone</span><strong>{viewMember.phone || '—'}</strong></div>
              <div><span>Occupation</span><strong>{viewMember.occupation || '—'}</strong></div>
              <div><span>Role</span><strong><span className={`badge badge-${viewMember.role}`}>{viewMember.role}</span></strong></div>
              <div><span>Status</span><strong>{viewMember.isActive ? 'Active' : 'Inactive'}</strong></div>
              <div><span>National ID</span><strong>{viewMember.nationalId || '—'}</strong></div>
              <div><span>Address</span><strong>{viewMember.address || '—'}</strong></div>
              <div><span>Joined</span><strong>{new Date(viewMember.joinDate || viewMember.createdAt).toLocaleDateString()}</strong></div>
            </div>

            <p className="form-section-title" style={{ textAlign: 'left', marginTop: 16 }}>Emergency Contact</p>
            <div className="detail-grid">
              <div><span>Name</span><strong>{viewMember.emergencyContact || '—'}</strong></div>
              <div><span>Phone</span><strong>{viewMember.emergencyPhone || '—'}</strong></div>
            </div>

            <p className="form-section-title" style={{ textAlign: 'left', marginTop: 16 }}>Next of Kin</p>
            <div className="detail-grid">
              <div><span>Name</span><strong>{viewMember.nextOfKin || '—'}</strong></div>
              <div><span>Relationship</span><strong>{viewMember.nextOfKinRelationship || '—'}</strong></div>
              <div><span>Phone</span><strong>{viewMember.nextOfKinPhone || '—'}</strong></div>
            </div>

            {summary && (
              <>
                <p className="form-section-title" style={{ textAlign: 'left', marginTop: 16 }}>Financial Summary</p>
                <div className="summary-grid">
                  <div className="summary-item green"><span>Total Savings</span><strong>TZS {fmt(summary.totalSavings)}</strong></div>
                  <div className="summary-item orange"><span>Active Loans</span><strong>{summary.activeLoans}</strong></div>
                  <div className="summary-item blue"><span>Loan Balance</span><strong>TZS {fmt(summary.totalLoanBalance)}</strong></div>
                  <div className="summary-item red"><span>Unpaid Penalties</span><strong>{summary.unpaidPenalties}</strong></div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
