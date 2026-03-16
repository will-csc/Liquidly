import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { useForm } from '../hooks/useForm';
import '../styles/LoginPage.css';
import '../styles/ErrorPopup.css';
import loginBackground from '../assets/images/login-image.png';
import logoWhite from '../assets/images/logo-white.png';
import cameraIcon from '../assets/images/camera-icon.png';
import type { LoginRequest } from '../types';
import { useI18n } from '@/i18n/i18n';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isExiting, setIsExiting] = useState(false);

  // Auto-hide error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const { formData, handleChange } = useForm({
    email: '',
    password: ''
  });

  const handleNavigation = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500); // Match animation duration
  };

  const handleSignUp = () => {
    handleNavigation('/signup');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    handleNavigation('/forgot-password');
  };
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Small delay to ensure ref is attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(t("login.cameraPermissionError"));
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const captureAndLogin = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        
        stopCamera();
        setLoading(true);
        
        try {
          const auth = await authService.loginFace({ faceImage: imageData });
          console.log('Face Login successful:', auth.user);
          localStorage.setItem('user', JSON.stringify(auth.user));
          const token = typeof auth.token === "string" ? auth.token.trim() : "";
          if (!token) {
            localStorage.removeItem('token');
            setError("Resposta inválida do login (token ausente).");
            return;
          }
          localStorage.setItem('token', token);
          navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
          console.error('Face Login failed:', err);
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
          setError(maybeMessage || t("login.faceNotRecognized"));
          setLoading(false);
        }
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password
      };
      
      const auth = await authService.login(loginData);
      console.log('Login successful:', auth.user);
      localStorage.setItem('user', JSON.stringify(auth.user));
      const token = typeof auth.token === "string" ? auth.token.trim() : "";
      if (!token) {
        localStorage.removeItem('token');
        setError("Resposta inválida do login (token ausente).");
        return;
      }
      localStorage.setItem('token', token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      console.error('Login failed:', err);
      // Tenta pegar a mensagem de erro da resposta do servidor (JSON), ou erro genérico de rede
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
      const errorMessage = maybeMessage || 'We are having communications problems, please wait some minutes. If the problem persists, send a email to liquidly@gmail.com';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // handleSignUp is defined above

  return (
    <div className="login-container">
      <div className="login-card">
        <div className={`login-form-section ${isExiting ? 'slide-out-right' : 'slide-in-right'}`}>
          <h2 className="login-title">
            {t("login.title").split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
          </h2>
          
          {error && (
            <div className="error-popup">
              <div className="error-popup-content">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            {!isCameraOpen ? (
              <>
                <Input
                  label={t("common.email")}
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                
                <Input
                  label={t("common.password")}
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? t("login.loggingIn") : t("common.login")}
                </Button>
                
                <Button type="button" variant="outline" onClick={handleSignUp} disabled={loading}>{t("common.signup")}</Button>
                
                <div className="login-divider">
                  <span>{t("common.or")}</span>
                </div>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={loading}
                  className="btn-primary btn-face-login"
                >
                  <img src={cameraIcon} alt="Face Login" style={{ width: '24px', height: '24px' }} />
                  {t("login.loginWithFace")}
                </button>
                
                <a href="/forgot-password" onClick={handleForgotPassword} className="forgot-password-link">
                  {t("login.forgotPassword")} <span className="click-here">{t("login.clickHere")}</span>
                </a>
              </>
            ) : (
              <div className="camera-container" style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', backgroundColor: '#000' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Button type="button" variant="primary" onClick={captureAndLogin} disabled={loading}>
                    {loading ? t("login.verifying") : t("login.captureAndLogin")}
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera} disabled={loading}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className={`login-image-section ${isExiting ? 'slide-out-left' : 'slide-in-left'}`} style={{ backgroundImage: `url(${loginBackground})` }}>
          <div className="image-content">
            <img src={logoWhite} alt="Liquidly Logo" className="login-logo" />
            <p className="image-caption">{t("login.jobDone")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
