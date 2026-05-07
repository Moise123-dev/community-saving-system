import { useNavigate } from 'react-router-dom';
import { PiggyBank, ShieldCheck, Users } from 'lucide-react';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="auth-page role-select-page">
      <div className="role-select-card">
        {/* Header */}
        <div className="auth-logo">
          <PiggyBank size={52} />
          <h1>CommSave</h1>
          <p>Community Saving System</p>
        </div>

        <p className="role-select-prompt">Who are you? Choose your role to continue</p>

        <div className="role-options">
          {/* Manager card */}
          <button
            className="role-option role-manager"
            onClick={() => navigate('/login?role=manager')}
          >
            <div className="role-icon">
              <ShieldCheck size={40} />
            </div>
            <div className="role-info">
              <h3>Manager</h3>
              <p>Full system access — manage members, approve loans, view all reports</p>
            </div>
            <span className="role-arrow">→</span>
          </button>

          {/* Member card */}
          <button
            className="role-option role-member"
            onClick={() => navigate('/login?role=member')}
          >
            <div className="role-icon">
              <Users size={40} />
            </div>
            <div className="role-info">
              <h3>Member</h3>
              <p>View your savings, request loans, track your account activity</p>
            </div>
            <span className="role-arrow">→</span>
          </button>
        </div>

        <p className="role-select-footer">
          New member?{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
