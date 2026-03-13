import React from 'react';
import '../styles/PasswordStrengthMeter.css';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const requirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'One uppercase letter', regex: /[A-Z]/ },
    { label: 'One number', regex: /[0-9]/ },
    { label: 'One special character', regex: /[!@#$%^&*(),.?":{}|<>]/ }
  ];

  return (
    <div className="password-strength-meter">
      {requirements.map((req, index) => {
        const isMet = req.regex.test(password);
        return (
          <div key={index} className={`requirement ${isMet ? 'met' : 'unmet'}`}>
            <span className="icon">{isMet ? '✔' : '✖'}</span>
            <span className="label">{req.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PasswordStrengthMeter;
