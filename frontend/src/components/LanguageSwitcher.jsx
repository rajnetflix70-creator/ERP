import React from 'react';
import { useTranslation } from 'react-i18next';

// variant: 'sidebar' (dark bg) | 'topbar' (light bg, default)
const LanguageSwitcher = ({ variant = 'topbar' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const sidebarStyle = {
    display: 'flex',
    gap: '4px',
  };

  const btnStyle = (active) => variant === 'sidebar'
    ? {
        padding: '4px 10px',
        borderRadius: '4px',
        border: `1.5px solid ${active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}`,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.65)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
      }
    : undefined;

  return (
    <div className={variant === 'topbar' ? 'lang-switcher' : undefined} style={variant === 'sidebar' ? sidebarStyle : undefined}>
      {['en', 'hi', 'ar'].map((lng) => {
        const label = lng === 'en' ? 'EN' : lng === 'hi' ? 'हि' : 'ع';
        const isActive = i18n.language === lng || i18n.language.startsWith(lng);
        return (
          <button
            key={lng}
            className={variant === 'topbar' ? `lang-btn ${isActive ? 'active' : ''}` : undefined}
            style={variant === 'sidebar' ? btnStyle(isActive) : undefined}
            onClick={() => changeLanguage(lng)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
