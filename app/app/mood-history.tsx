import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoodDayDetail } from '@/components/mood/MoodDayDetail';
import { MoodMonthGrid } from '@/components/mood/MoodMonthGrid';
import { ScreenBackground } from '@/components/ScreenBackground';
import { dateKeyFromLocal } from '@/lib/api/history';
import { useMoodMonth } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * "Como me senti" — a month calendar colored by daily mood. Tap a day to see
 * its face + tags + note below, and log/edit it (any past day) from there.
 */
export default function MoodHistoryScreen() {
  const router = useRouter();
  const { t } = useT();
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(new Date()),
  );

  const month = useMoodMonth(visibleMonth);
  const selectedKey = useMemo(() => dateKeyFromLocal(selected), [selected]);

  const today = new Date();
  const canGoNextMonth =
    visibleMonth.getFullYear() < today.getFullYear() ||
    (visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() < today.getMonth());

  const handlePrevMonth = () =>
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () => {
    const next = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    if (next.getTime() > Date.now()) return;
    setVisibleMonth(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.title}>{t('mood.history.title')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridCard}>
            {month.isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={tokens.brand.violet2} />
              </View>
            ) : (
              <MoodMonthGrid
                moods={month.data}
                monthDate={visibleMonth}
                selected={selected}
                onSelectDay={(d) => {
                  setSelected(d);
                  if (!isSameMonth(d, visibleMonth)) {
                    setVisibleMonth(startOfMonth(d));
                  }
                }}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                canGoNext={canGoNextMonth}
              />
            )}
          </View>

          <MoodDayDetail dateKey={selectedKey} />
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  content: {
    padding: tokens.space[4],
    gap: tokens.space[4],
    paddingBottom: tokens.space[8],
  },
  gridCard: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[4],
  },
  loading: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
  },
});
