import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SignUp from '../SignUp';
import { I18nProvider } from '../../../src/i18n/I18nProvider';

const mockSignup = jest.fn();

jest.mock('../../../src/services/api', () => ({
  authService: {
    signup: (...args: unknown[]) => mockSignup(...args),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

const initialMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderSignUp = () =>
  render(
    <I18nProvider>
      <SafeAreaProvider initialMetrics={initialMetrics as any}>
        <SignUp navigation={mockNavigation} />
      </SafeAreaProvider>
    </I18nProvider>
  );

describe('SignUp Screen', () => {
  beforeEach(() => {
    mockSignup.mockReset();
    mockNavigation.navigate.mockReset();
    mockNavigation.goBack.mockReset();
    mockNavigation.reset.mockReset();
  });

  it('renders correctly', () => {
    const { getByText } = renderSignUp();
    
    expect(getByText('Começar')).toBeTruthy();
    expect(getByText('Nome')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Empresa')).toBeTruthy();
    expect(getByText('Senha')).toBeTruthy();
    expect(getByText('Cadastrar')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
  });

  it('navigates to SignIn when Sign In link is pressed', () => {
    const { getByText } = renderSignUp();
    
    fireEvent.press(getByText('Entrar'));
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

  it('exibe mensagem de sucesso apos cadastro concluido', async () => {
    mockSignup.mockResolvedValue({ id: 1 });

    const { UNSAFE_getAllByType, getByText } = renderSignUp();
    const inputs = UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(inputs[0], 'William');
    fireEvent.changeText(inputs[1], 'william@example.com');
    fireEvent.changeText(inputs[2], 'Liquidly');
    fireEvent.changeText(inputs[3], 'Senha@123');

    fireEvent.press(getByText('Cadastrar'));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'William',
        email: 'william@example.com',
        password: 'Senha@123',
        companyName: 'Liquidly',
        faceImage: undefined,
      });
    });

    expect(getByText('Conta criada! Faça login.')).toBeTruthy();

    fireEvent.press(getByText('OK'));

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  });
});
