import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PiggyBank, Eye, EyeOff, LogIn, ShieldCheck, Users, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'member'; // 'manager' or 'member'

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManager = role === 'manager';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);

      // Enforce role match — prevent a member logging in via manager portal
      if (data.user.role !== role) {
        toast.error(
          isManager
            ? 'This account is not a Manager account. Use the Member login.'
            : 'This account is not a Member account. Use the Manager login.'
        );
        // Clear everything — including context state
        localStorage.removeItem('css_token');
        localStorage.removeItem('css_user');
        // Force context user to null by calling logout via the context
        window.dispatchEvent(new Event('css_logout'));
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      // ✅ Correct path — all protected routes live under /app
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Role banner */}
      <div className={`role-banner ${isManager ? 'banner-manager' : 'banner-member'}`}>
        {isManager ? <ShieldCheck size={18} /> : <Users size={18} />}
        <span>{isManager ? 'Manager Login' : 'Member Login'}</span>
      </div>

      <div className="auth-card">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="auth-logo">
          <div className={`auth-role-icon ${isManager ? 'icon-manager' : 'icon-member'}`}>
            {isManager ? <ShieldCheck size={36} /> : <Users size={36} />}
          </div>
          <h1>CommSave</h1>
          <p>{isManager ? 'Manager Portal' : 'Member Portal'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-full ${isManager ? 'btn-manager' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? <span className="spinner-sm" /> : <LogIn size={18} />}
            {loading ? 'Signing in...' : `Sign In as ${isManager ? 'Manager' : 'Member'}`}
          </button>
        </form>

        {/* Only members can self-register */}
        {!isManager && (
          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        )}

        {isManager && (
          <p className="auth-footer">
            Manager accounts are created by the system administrator.
          </p>
        )}
      </div>
    </div>
  );
}
