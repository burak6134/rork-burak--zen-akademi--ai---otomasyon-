import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[ErrorBoundary] getDerivedStateFromError', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] componentDidCatch', error, errorInfo);
  }

  handleReset = () => {
    console.log('[ErrorBoundary] reset pressed');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container} testID="error-boundary">
          <ThemedText type="h2">Bir şeyler ters gitti</ThemedText>
          <ThemedText type="body" color="muted" style={styles.message}>
            Uygulama beklenmeyen bir hata ile karşılaştı. Devam etmek için yeniden deneyin.
          </ThemedText>
          <Pressable onPress={this.handleReset} style={styles.button} testID="error-reset">
            <ThemedText type="body" style={styles.buttonText}>Tekrar Dene</ThemedText>
          </Pressable>
        </ThemedView>
      );
    }

    return <>{this.props.children}</>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});
