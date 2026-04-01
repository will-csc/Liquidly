import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPassword from '../ForgotPassword';
import { I18nProvider } from '../../../src/i18n/I18nProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  }
}));

jest.mock('../../services/api', () => ({
  authService: {
    emailExists: jest.fn(async () => true),
    sendRecoveryCode: jest.fn(async () => undefined),
    resetPassword: jest.fn(async () => undefined),
  }
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('ForgotPassword Screen', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <I18nProvider>
        <ForgotPassword navigation={mockNavigation} />
      </I18nProvider>
    );
    
    expect(getByText('Redefinir senha')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Enviar código')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('navigates to SignIn when Login button is pressed', () => {
    const { getByText } = render(
      <I18nProvider>
        <ForgotPassword navigation={mockNavigation} />
      </I18nProvider>
    );
    
    fireEvent.press(getByText('Login'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('shows reset inputs when Send Code is pressed', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <I18nProvider>
        <ForgotPassword navigation={mockNavigation} />
      </I18nProvider>
    );
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Enviar código'));
    
    return waitFor(() => {
      expect(getByText('Nova senha')).toBeTruthy();
      expect(getByText('Código enviado no seu email')).toBeTruthy();
      expect(getByText('Redefinir')).toBeTruthy();
    });
  });
});
