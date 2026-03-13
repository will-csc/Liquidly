import React, { type ButtonHTMLAttributes } from 'react';
import '../styles/GlobalComponents.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'outline':
        return 'btn-outline';
      default:
        return 'btn-primary';
    }
  };

  return (
    <button className={`${getVariantClass()} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
