import { useNavigate } from 'react-router-dom';
import { PiggyBank, ShieldCheck, Users, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="auth-page role-select-page">
      <div className="role-select-card">
        {/* Language switcher button */}
        <button className="lang-switch-btn" onClick={() => navigate('/language')}>
          <Globe size={16} /> Change Language
        </button>

        {/* Header */}
        <div className="auth-logo">
          <PiggyBank size={52} />
          <h1>{t('appName')}</h1>
          <p>{t('appSubtitle')}</p>
        </div>

        <p className="role-select-prompt">{t('whoAreYou')}</p>

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
              <h3>{t('manager')}</h3>
              <p>{t('managerDesc')}</p>
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
              <h3>{t('member')}</h3>
              <p>{t('memberDesc')}</p>
            </div>
            <span className="role-arrow">→</span>
          </button>
        </div>

        <p className="role-select-footer">
          {t('newMember')}{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>
            {t('registerHere')}
          </button>
        </p>
      </div>
    </div>
  );
}
