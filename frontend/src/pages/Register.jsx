import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { PiggyBank, UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', nationalId: '', address: '',
    occupation: '', emergencyContact: '', emergencyPhone: '',
    nextOfKin: '', nextOfKinPhone: '', nextOfKinRelationship: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2-step form

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      // Members always register as 'member'
      await api.post('/auth/register', { ...payload, role: 'member' });
      toast.success('Registration successful! Please login.');
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
        <span>New Member Registration — Step {step} of 2</span>
      </div>

      <div className="auth-card auth-card-lg">
        <button className="back-btn" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
          <ArrowLeft size={16} /> {step === 2 ? 'Back to Step 1' : 'Back'}
        </button>

        <div className="auth-logo">
          <PiggyBank size={40} />
          <h1>CommSave</h1>
          <p>Create your member account</p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Account Info
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Personal Details
          </div>
        </div>

        {/* ── Step 1: Account Info ── */}
        {step === 1 && (
          <form onSubmit={handleNext} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input id="name" type="text" placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input id="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input id="phone" type="tel" placeholder="+255 700 000 000" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="form-group">
                <label htmlFor="nationalId">National ID</label>
                <input id="nationalId" type="text" placeholder="National ID number" value={form.nationalId} onChange={set('nationalId')} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input id="address" type="text" placeholder="Your home address" value={form.address} onChange={set('address')} />
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              Next: Personal Details →
            </button>
          </form>
        )}

        {/* ── Step 2: Personal Details ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input id="occupation" type="text" placeholder="e.g. Teacher, Farmer, Trader" value={form.occupation} onChange={set('occupation')} />
            </div>

            <p className="form-section-title">Emergency Contact</p>
            <div className="form-row">
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input type="text" placeholder="Full name" value={form.emergencyContact} onChange={set('emergencyContact')} />
              </div>
              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input type="tel" placeholder="+255 700 000 000" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
              </div>
            </div>

            <p className="form-section-title">Next of Kin</p>
            <div className="form-row">
              <div className="form-group">
                <label>Next of Kin Name</label>
                <input type="text" placeholder="Full name" value={form.nextOfKin} onChange={set('nextOfKin')} />
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
            <div className="form-group">
              <label>Next of Kin Phone</label>
              <input type="tel" placeholder="+255 700 000 000" value={form.nextOfKinPhone} onChange={set('nextOfKinPhone')} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : <UserPlus size={18} />}
              {loading ? 'Creating account...' : 'Create My Account'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login?role=member">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
