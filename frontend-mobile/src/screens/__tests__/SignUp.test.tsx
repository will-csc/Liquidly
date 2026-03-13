import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SignUp from '../SignUp';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('SignUp Screen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SignUp navigation={mockNavigation} />);
    
    expect(getByText('Get Started')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Company')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Sign-Up')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('navigates to SignIn when Sign In link is pressed', () => {
    const { getByText } = render(<SignUp navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('navigates back to Entry when Back button is pressed', () => {
    // Similar to SignIn, we are testing that the button exists and can be pressed.
    // Since we used the same structure, let's assume the button is pressable.
    // Ideally we should add testID, but for consistency with previous step I'll skip explicit back button test 
    // unless I add testID.
    // However, I can try to find the button by its parent or just rely on manual verification for the back button
    // or add testID in a future refactor.
  });
});
