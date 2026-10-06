import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { quotaStore } from './api/nexwall';

export const colors = {
  background: '#0f1115',
  surface: '#1b1f27',
  text: '#f2f4f8',
  muted: '#9aa3b2',
  accent: '#6c8cff',
};

/** "N left today", updated after every API response. */
export function QuotaBadge() {
  const remaining = useSyncExternalStore(quotaStore.subscribe, quotaStore.get);
  if (remaining === null) return null;
  return <Text style={styles.quota}>{remaining} left today</Text>;
}

export function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <QuotaBadge />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { color: colors.accent, fontSize: 16 },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '600' },
  quota: { color: colors.muted, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.text, textAlign: 'center', marginBottom: 12 },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
