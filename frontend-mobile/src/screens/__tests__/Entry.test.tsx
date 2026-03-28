import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Entry from '../Entry';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

const initialMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderEntry = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics as any}>
      <Entry navigation={mockNavigation} />
    </SafeAreaProvider>
  );

describe('Entry Screen', () => {
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = renderEntry();
    
    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('Liquidations, simplified')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('navigates to SignIn when Sign In button is pressed', () => {
    const { getByText } = renderEntry();
    
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('navigates to SignUp when Sign Up button is pressed', () => {
    const { getByText } = renderEntry();
    
    fireEvent.press(getByText('Sign Up'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});
