import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

type ErrorOverlayProps = {
  message: string | null;
  title?: string;
  onClose: () => void;
};

export const getErrorMessage = (error: any, fallbackMessage: string) => {
  const raw = error?.response?.data?.message ?? error?.message;
  const message = typeof raw === 'string' ? raw.split('\n')[0].trim() : '';
  if (message.length > 0) return message;
  return fallbackMessage;
};

export const getErrorSummary = (error: any, fallbackMessage: string) => {
  const message = getErrorMessage(error, fallbackMessage);
  const stack = typeof error?.stack === 'string' ? error.stack : '';
  if (!stack) return message;

  const lines = stack.split('\n').map((l: string) => l.trim());
  const location =
    lines.find((l: string) => l.includes('\\src\\') || l.includes('/src/')) ||
    lines.find((l: string) => l.includes('.tsx') || l.includes('.ts')) ||
    '';

  return location ? `${message}\n${location}` : message;
};

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ message, title = 'Erro', onClose }) => {
  const visible = Boolean(message && message.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity onPress={onClose} style={styles.actionButton} accessibilityRole="button">
            <Text style={styles.actionText}>Ok</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    color: theme.colors.error,
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 18,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.textLight,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: 14,
  },
  actionButton: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  actionText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default ErrorOverlay;
