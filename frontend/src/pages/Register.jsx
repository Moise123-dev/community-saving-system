import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { PiggyBank, UserPlus, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', nationalId: '', address: '',
    occupation: '', emergencyContact: '', emergencyPhone: '',
    nextOfKin: '', nextOfKinPhone: '', nextOfKinRelationship: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.post('/auth/register', { ...payload, role: 'member' });
      toast.success(t('registrationSuccess'));
      navigate('/login?role=member');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="role-banner banner-member">
        <UserPlus size={18} />
        <span>{t('step')} {step} {t('of')} 2 — {step === 1 ? t('accountInfo') : t('personalDetails')}</span>
      </div>

      <div className="auth-card auth-card-lg">
        <button className="back-btn" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
          <ArrowLeft size={16} /> {step === 2 ? `← ${t('back')}` : t('back')}
        </button>

        <div className="auth-logo">
          <PiggyBank size={40} />
          <h1>{t('appName')}</h1>
          <p>{t('createAccount')}</p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> {t('accountInfo')}
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> {t('personalDetails')}
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleNext} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t('fullName')} *</label>
                <input type="text" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label>{t('emailAddress')} *</label>
                <input type="email" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('password')} *</label>
                <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="form-group">
                <label>{t('confirmPassword')} *</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('phoneNumber')} *</label>
                <input type="tel" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="form-group">
                <label>{t('nationalId')}</label>
                <input type="text" value={form.nationalId} onChange={set('nationalId')} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('address')}</label>
              <input type="text" value={form.address} onChange={set('address')} />
            </div>
            <button type="submit" className="btn btn-primary btn-full">{t('nextStep')}</button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{t('occupation')}</label>
              <input type="text" value={form.occupation} onChange={set('occupation')} />
            </div>
            <p className="form-section-title">{t('emergencyContact')}</p>
            <div className="form-row">
              <div className="form-group">
                <label>{t('emergencyContact')}</label>
                <input type="text" value={form.emergencyContact} onChange={set('emergencyContact')} />
              </div>
              <div className="form-group">
                <label>{t('emergencyPhone')}</label>
                <input type="tel" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
              </div>
            </div>
            <p className="form-section-title">{t('nextOfKin')}</p>
            <div className="form-row">
              <div className="form-group">
                <label>{t('nextOfKin')}</label>
                <input type="text" value={form.nextOfKin} onChange={set('nextOfKin')} />
              </div>
              <div className="form-group">
                <label>{t('relationship')}</label>
                <select value={form.nextOfKinRelationship} onChange={set('nextOfKinRelationship')}>
                  <option value="">—</option>
                  <option value="spouse">Spouse / Umuganwa / Mwenzi</option>
                  <option value="parent">Parent / Umubyeyi / Mzazi</option>
                  <option value="child">Child / Umwana / Mtoto</option>
                  <option value="sibling">Sibling / Umuvandimwe / Ndugu</option>
                  <option value="relative">Relative / Umuryango / Jamaa</option>
                  <option value="friend">Friend / Inshuti / Rafiki</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{t('nextOfKinPhone')}</label>
              <input type="tel" value={form.nextOfKinPhone} onChange={set('nextOfKinPhone')} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : <UserPlus size={18} />}
              {loading ? t('loading') : t('createMyAccount')}
            </button>
          </form>
        )}

        <p className="auth-footer">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login?role=member">{t('signInHere')}</Link>
        </p>
      </div>
    </div>
  );
}
