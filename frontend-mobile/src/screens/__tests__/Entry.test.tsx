import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Entry from '../Entry';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('Entry Screen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Entry navigation={mockNavigation} />);
    
    expect(getByText('Liquidly')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('navigates to SignIn when Sign In button is pressed', () => {
    const { getByText } = render(<Entry navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('navigates to SignUp when Sign Up button is pressed', () => {
    const { getByText } = render(<Entry navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Sign Up'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});
