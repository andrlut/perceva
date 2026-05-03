import { Ionicons } from '@expo/vector-icons';
import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

interface Props {
  children: ReactNode;
  /** Render a custom fallback. If omitted, a default error card is shown. */
  fallback?: (error: Error, errorInfo: string | null) => ReactNode;
  /** Optional label shown above the error to identify which boundary tripped. */
  label?: string;
}

interface State {
  error: Error | null;
  errorInfo: string | null;
}

/**
 * Error boundary so a single broken section (e.g. an SVG chart that crashes
 * on Android) doesn't take down the whole screen. When something throws,
 * we render the error message + stack inline so the user can read what
 * went wrong without needing a debugger / logcat.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[ErrorBoundary] caught', this.props.label ?? '', error, info);
    this.setState({ error, errorInfo: info.componentStack ?? null });
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, errorInfo);
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="warning" size={16} color={tokens.semantic.danger} />
          <Text style={styles.title}>
            {this.props.label ?? 'Something broke'}
          </Text>
        </View>
        <Text style={styles.message}>{error.message || String(error)}</Text>
        {errorInfo ? (
          <Text style={styles.stack} numberOfLines={12}>
            {errorInfo.trim()}
          </Text>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,92,122,0.08)',
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.4)',
    padding: tokens.space[3],
    gap: tokens.space[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.danger,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  message: {
    ...tokens.type.body,
    color: tokens.text.hi,
  },
  stack: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    fontFamily: 'Manrope_500Medium',
  },
});
