import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { PiggyBank, Check } from 'lucide-react';

const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    greeting: 'Welcome',
    desc: 'Continue in English',
  },
  {
    code: 'rw',
    name: 'Kinyarwanda',
    nativeName: 'Kinyarwanda',
    flag: '🇷🇼',
    greeting: 'Murakaza neza',
    desc: 'Komeza mu Kinyarwanda',
  },
  {
    code: 'sw',
    name: 'Kiswahili',
    nativeName: 'Kiswahili',
    flag: '🇹🇿',
    greeting: 'Karibu',
    desc: 'Endelea kwa Kiswahili',
  },
];

export default function LanguageSelect() {
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSelect = (code) => {
    changeLanguage(code);
    navigate('/');
  };

  return (
    <div className="lang-page">
      <div className="lang-card">
        {/* Logo */}
        <div className="lang-logo">
          <div className="lang-logo-icon">
            <PiggyBank size={40} />
          </div>
          <h1>CommSave</h1>
          <p>Community Saving System</p>
        </div>

        {/* Title */}
        <div className="lang-title">
          <h2>🌍 Choose Your Language</h2>
          <p>Hitamo ururimi / Chagua lugha yako</p>
        </div>

        {/* Language options */}
        <div className="lang-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${language === lang.code ? 'selected' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <div className="lang-info">
                <strong>{lang.nativeName}</strong>
                <span>{lang.greeting} — {lang.desc}</span>
              </div>
              {language === lang.code && (
                <div className="lang-check">
                  <Check size={18} />
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="lang-footer">
          You can change the language anytime from settings
        </p>
      </div>
    </div>
  );
}
