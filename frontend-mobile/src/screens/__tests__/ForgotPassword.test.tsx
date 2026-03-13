import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPassword from '../ForgotPassword';

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
    const { getByText } = render(<ForgotPassword navigation={mockNavigation} />);
    
    expect(getByText('Reset your password')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Send Code')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('navigates to SignIn when Login button is pressed', () => {
    const { getByText } = render(<ForgotPassword navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Login'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('shows reset inputs when Send Code is pressed', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(<ForgotPassword navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Send Code'));
    
    return waitFor(() => {
      expect(getByText('New Password')).toBeTruthy();
      expect(getByText('Code Sent on Your Email')).toBeTruthy();
      expect(getByText('Reset')).toBeTruthy();
    });
  });
});
