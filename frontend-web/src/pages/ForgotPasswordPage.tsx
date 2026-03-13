import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ForgotPasswordPage.css';
import '../styles/ErrorPopup.css';
import logoWhite from '../assets/images/logo-white.png';
import forgotPasswordBg from '../assets/images/forgotpassword-image.png';
import Input from '../components/Input';
import Button from '../components/Button';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useForm } from '../hooks/useForm';
import { authService } from '../services/api';
import { useI18n } from '@/i18n/i18n';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { formData, handleChange } = useForm({
    email: '',
    newPassword: '',
    verificationCode: ''
  });
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!isCodeSent) {
      const email = formData.email.trim();
      try {
        const exists = await authService.emailExists(email);
        if (!exists) {
          setError(t("forgot.emailNotRegistered"));
          return;
        }
        try {
          await authService.sendRecoveryCode(email);
          setConfirmedEmail(email);
          setIsCodeSent(true);
        } catch (err) {
          console.error(err);
          setError(t("forgot.sendCodeFailed"));
          return;
        }
      } catch (err) {
        console.error(err);
        setError(t("forgot.emailCheckFailed"));
        return;
      } finally {
        setLoading(false);
      }

      return;
    } else {
      try {
        const code = formData.verificationCode.trim();
        const newPassword = formData.newPassword;
        await authService.resetPassword(confirmedEmail, code, newPassword);
        handleNavigation('/login');
      } catch (err: unknown) {
        console.error(err);
        const maybeMessage = (() => {
          if (typeof err === "object" && err !== null && "response" in err) {
            const response = (err as { response?: { data?: unknown } }).response;
            const data = response?.data;
            if (typeof data === "object" && data !== null && "message" in data) {
              const message = (data as { message?: unknown }).message;
              if (typeof message === "string") return message;
            }
          }
          return null;
        })();
        setError(maybeMessage || t("forgot.resetFailed"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogin = () => {
    handleNavigation('/login');
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        {/* Left Section - Visual */}
        <div 
          className={`forgot-password-visual-section ${isExiting ? 'slide-out-left' : 'slide-in-left'}`}
          style={{ backgroundImage: `url(${forgotPasswordBg})` }}
        >
          <div className="visual-content">
            <img src={logoWhite} alt="Logo" className="forgot-password-logo" />
            <h2 className="visual-text">Recovering your account is not a problem for us!</h2>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className={`forgot-password-form-section ${isExiting ? 'slide-out-right' : 'slide-in-right'}`}>
          <h2 className="forgot-password-title">{t("forgot.title")}</h2>

          {error && (
            <div className="error-popup">
              <div className="error-popup-content">
                {error}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendCode} className="forgot-password-form">
            {!isCodeSent ? (
              <Input
                label={t("common.email")}
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            ) : (
              <>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
                  {t("forgot.codeSentTo")} <strong>{confirmedEmail}</strong>
                </p>
                <Input
                  label={t("forgot.codeLabel")}
                  id="verificationCode"
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                />
                
                <Input
                  label={t("forgot.newPasswordLabel")}
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <PasswordStrengthMeter password={formData.newPassword} />
              </>
            )}

            <div className="button-group">
              <Button type="submit" variant="primary" disabled={loading}>
                {isCodeSent ? t("forgot.updatePassword") : t("forgot.sendCode")}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogin} disabled={loading}>{t("common.login")}</Button>
            </div>
          </form>

          <div className="support-link-container">
            <a href="mailto:support@liquidly.com" className="support-link">
              {t("forgot.support")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
