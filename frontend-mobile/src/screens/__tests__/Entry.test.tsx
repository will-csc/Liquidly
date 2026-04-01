import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Entry from '../Entry';
import { I18nProvider } from '../../../src/i18n/I18nProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  }
}));

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
    <I18nProvider>
      <SafeAreaProvider initialMetrics={initialMetrics as any}>
        <Entry navigation={mockNavigation} />
      </SafeAreaProvider>
    </I18nProvider>
  );

describe('Entry Screen', () => {
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = renderEntry();
    
    expect(getByText('Pular')).toBeTruthy();
    expect(getByText('Liquidações, simplificadas')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
    expect(getByText('Cadastrar')).toBeTruthy();
  });

  it('navigates to SignIn when Sign In button is pressed', () => {
    const { getByText } = renderEntry();
    
    fireEvent.press(getByText('Entrar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('navigates to SignUp when Sign Up button is pressed', () => {
    const { getByText } = renderEntry();
    
    fireEvent.press(getByText('Cadastrar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});
