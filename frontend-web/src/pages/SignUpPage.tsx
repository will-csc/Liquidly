import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SignUpPage.css';
import logoWhite from '../assets/images/logo-white.png';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorPopup from '../components/ErrorPopup';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useForm } from '../hooks/useForm';
import { authService } from '../services/api';
import type { SignupRequest } from '../types';
import { useI18n } from '@/i18n/i18n';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigation = (path: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500);
  };
  
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
    name: '',
    email: '',
    company: '',
    password: ''
  });

  // Camera Logic
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setFaceImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  const capturePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFaceImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    setFaceImage(null);
    startCamera();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const getApiError = (err: unknown) => {
        if (typeof err !== "object" || err === null || !("response" in err)) return null;
        const response = (err as { response?: { status?: number; data?: unknown } }).response;
        const status = response?.status;
        const data = response?.data;
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? (data as { message?: unknown }).message
            : undefined;
        return {
          status,
          message: typeof message === "string" ? message : null,
        };
      };

      if (faceImage) {
        try {
          await authService.loginFace({ faceImage });
          setError(t("signup.faceAlreadyRegistered"));
          return;
        } catch (err: unknown) {
          const apiError = getApiError(err);
          const message = apiError?.message?.toLowerCase() || "";
          const status = apiError?.status;
          const canProceed =
            status === 401 ||
            status === 403 ||
            status === 404 ||
            message.includes("not recognized") ||
            message.includes("not recognised") ||
            message.includes("not found") ||
            message.includes("não reconhe") ||
            message.includes("nao reconhe");

          if (!canProceed) {
            setError(t("signup.faceCheckFailed"));
            return;
          }
        }
      }

      const signupData: SignupRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.company, // Map 'company' from form to 'companyName' for API
        faceImage: faceImage || undefined
      };

      const user = await authService.signup(signupData);
      console.log('Sign Up successful:', user);
      setIsExiting(true);
      setTimeout(() => {
        navigate('/login', { state: { flash: t("signup.success"), email: formData.email } });
      }, 500);
    } catch (err: unknown) {
      console.error('Sign Up failed:', err);
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
      setError(maybeMessage || t("signup.failedGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    handleNavigation('/login');
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        {/* Left Section - Visual */}
        <div className={`signup-visual-section ${isExiting ? 'slide-out-right' : 'slide-in-right'}`}>
          <div className="visual-content">
            <img src={logoWhite} alt="Sign Up Visual" className="signup-image" />
            <h2 className="visual-text">{t("signup.visualText")}</h2>
          </div>
        </div>


        {/* Right Section - Form */}
        <div className={`signup-form-section ${isExiting ? 'slide-out-left' : 'slide-in-left'}`}>
          <h2 className="signup-title">{t("signup.title")}</h2>
          
          {error ? <ErrorPopup message={error} /> : null}

          <form onSubmit={handleSignUp} className="signup-form">
            <Input
              label={t("common.name")}
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

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
              label={t("common.company")}
              id="company"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
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
            <PasswordStrengthMeter password={formData.password} />

            {/* Camera Section */}
            <div className={`camera-section ${faceImage ? "camera-section--captured" : ""}`}>
              <label className="camera-title">{t("signup.faceRegistrationOptional")}</label>
              
              {!isCameraOpen && !faceImage && (
                <div className="consent-wrapper">
                   <label className="consent-label">
                     <input 
                       type="checkbox" 
                       checked={consentGiven} 
                       onChange={(e) => setConsentGiven(e.target.checked)} 
                       className="consent-checkbox"
                     />
                     {t("signup.faceConsent")}
                   </label>
                </div>
              )}

              {!isCameraOpen && !faceImage && consentGiven && (
                <Button
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    startCamera()
                  }}
                  variant="none"
                  className="btn-enable-camera"
                >
                  {t("signup.enableCamera")}
                </Button>
              )}

              {isCameraOpen && (
                <div className="camera-preview">
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                  />
                  <Button onClick={capturePhoto} variant="none" className="btn-capture">
                    {t("signup.capturePhoto")}
                  </Button>
                </div>
              )}

              {faceImage && (
                <div className="captured-image-wrapper">
                  <div className="photo-success-message">
                    {t("signup.photoTaken")}
                  </div>
                  <Button onClick={retakePhoto} variant="none" className="btn-retake">
                    {t("signup.retakePhoto")}
                  </Button>
                </div>
              )}
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="button-group">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t("signup.signingUp") : t("common.signup")}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogin} disabled={loading}>{t("common.login")}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
