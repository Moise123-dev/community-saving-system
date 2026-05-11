import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { PiggyBank, Eye, EyeOff, LogIn, ShieldCheck, Users, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'member';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManager = role === 'manager';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);

      if (data.user.role !== role) {
        toast.error(isManager ? t('notManagerAccount') : t('notMemberAccount'));
        localStorage.removeItem('css_token');
        localStorage.removeItem('css_user');
        window.dispatchEvent(new Event('css_logout'));
        setLoading(false);
        return;
      }

      toast.success(`${t('welcomeBack')}, ${data.user.name}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`role-banner ${isManager ? 'banner-manager' : 'banner-member'}`}>
        {isManager ? <ShieldCheck size={18} /> : <Users size={18} />}
        <span>{isManager ? t('managerLogin') : t('memberLogin')}</span>
      </div>

      <div className="auth-card">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> {t('back')}
        </button>

        <div className="auth-logo">
          <div className={`auth-role-icon ${isManager ? 'icon-manager' : 'icon-member'}`}>
            {isManager ? <ShieldCheck size={36} /> : <Users size={36} />}
          </div>
          <h1>{t('appName')}</h1>
          <p>{isManager ? t('managerPortal') : t('memberPortal')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('emailAddress')}</label>
            <input
              id="email" type="email"
              placeholder={t('emailAddress')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder={t('password')}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required autoComplete="current-password"
              />
              <button type="button" className="input-icon-btn"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}>
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
            {loading ? t('signingIn') : `${t('signInAs')} ${isManager ? t('manager') : t('member')}`}
          </button>
        </form>

        {!isManager && (
          <p className="auth-footer">
            {t('noAccount')}{' '}
            <Link to="/register">{t('registerHere')}</Link>
          </p>
        )}
        {isManager && (
          <p className="auth-footer">{t('managerNote')}</p>
        )}
      </div>
    </div>
  );
}
