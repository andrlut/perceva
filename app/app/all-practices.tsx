import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { AllPracticesBody } from '@/components/practices/AllPracticesBody';
import { ScreenBackground } from '@/components/ScreenBackground';
import { dateKeyFromLocal, useDayDetail } from '@/lib/api/history';
import { useActiveTasks } from '@/lib/api/tasks';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { tokens } from '@/theme';

/**
 * /all-practices — the standalone route for "Todas as práticas". Since the
 * Práticas tab gained its own Todas page (Onboarding simples, 2026-11) this
 * route only serves the calendar's "log on this day" door, which pushes it
 * with a `date` param. The body is shared (AllPracticesBody).
 */
export default function AllPracticesScreen() {
  const router = useRouter();
  const { t } = useT();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const settings = useLoadedSettings();
  const bottomClearance = useBottomSafeClearance();

  const selectedDate = useMemo(() => {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    return dt;
  }, [date]);

  // Same queries the body reads — pull-to-refresh refetches them here.
  const tasks = useActiveTasks();
  const dayDetail = useDayDetail(selectedDate, settings.weekStart);
  const { refreshing, onRefresh } = usePullToRefresh(() =>
    Promise.all([tasks.refetch(), dayDetail.refetch()]),
  );
  const selectedKey = dateKeyFromLocal(selectedDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.title}>{t('allPractices.title')}</Text>
          <Pressable
            onPress={() => router.push('/tasks')}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tasksHub.title')}
          >
            <Ionicons name="add" size={22} color={tokens.brand.violet2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(tokens.space[10], bottomClearance) + tokens.space[6],
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.brand.violet2}
              colors={[tokens.brand.violet2]}
            />
          }
        >
          <AllPracticesBody key={selectedKey} selectedDate={selectedDate} />
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
});
