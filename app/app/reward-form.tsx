import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { IconPickerModal } from '@/components/IconPickerModal';
import {
  useArchiveReward,
  useCreateReward,
  useReward,
  useUpdateReward,
  type RewardFormInput,
} from '@/lib/api/rewards';
import type { RewardCategory } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { freeLimitEntity, useLimitModalStore } from '@/lib/premium';
import { useKeyboardOverlap } from '@/lib/use-keyboard-height';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META, REWARD_CATEGORY_ORDER } from '@/theme/rewards';

export default function RewardFormScreen() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const isEdit = !!params.id;
  const initialCategory: RewardCategory =
    params.category === 'good' || params.category === 'experience'
      ? params.category
      : 'indulgence';

  const existing = useReward(params.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costStr, setCostStr] = useState('50');
  const [icon, setIcon] = useState<string>('gift');
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [category, setCategory] = useState<RewardCategory>(initialCategory);
  const [isOneShot, setIsOneShot] = useState(false);
  const keyboardHeight = useKeyboardOverlap();

  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setDescription(existing.data.description ?? '');
      setCostStr(String(existing.data.cost));
      setIcon(existing.data.icon);
      setCategory(existing.data.category);
      setIsOneShot(existing.data.is_one_shot);
    }
  }, [existing.data]);

  const createReward = useCreateReward();
  const updateReward = useUpdateReward(params.id ?? '');
  const archiveReward = useArchiveReward();

  const isSubmitting =
    createReward.isPending || updateReward.isPending || archiveReward.isPending;

  const formInput = useMemo<RewardFormInput>(() => {
    const parsedCost = parseInt(costStr, 10);
    return {
      title: title.trim(),
      description: description.trim() === '' ? null : description.trim(),
      cost: Number.isFinite(parsedCost) ? parsedCost : 0,
      icon,
      category,
      isOneShot,
    };
  }, [title, description, costStr, icon, category, isOneShot]);

  const handleSave = async () => {
    if (!formInput.title) {
      Alert.alert(t('reward.form.missingTitleTitle'), t('reward.form.missingTitleBody'));
      return;
    }
    if (formInput.cost < 1) {
      Alert.alert(t('reward.form.missingCostTitle'), t('reward.form.missingCostBody'));
      return;
    }
    try {
      if (isEdit && params.id) {
        // Mexeu no TEXTO de uma recompensa adotada? Ela vira própria e o
        // catálogo para de falar por ela — mesma convenção do task-form.
        // A comparação é contra o texto JÁ localizado que preencheu o campo,
        // então só troca de idioma nunca conta como edição.
        const dropTemplateLink =
          existing.data?.template_id != null &&
          (formInput.title !== existing.data.title ||
            formInput.description !== existing.data.description);
        await updateReward.mutateAsync({ ...formInput, dropTemplateLink });
      } else {
        await createReward.mutateAsync(formInput);
      }
      router.back();
    } catch (e) {
      const limited = freeLimitEntity(e);
      if (limited) {
        router.back();
        useLimitModalStore.getState().open(limited);
        return;
      }
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      Alert.alert(t('reward.form.saveFailTitle'), msg);
    }
  };

  const handleArchive = async () => {
    if (!params.id) return;
    const ok = await confirmAction(
      t('reward.form.archiveConfirmTitle'),
      t('reward.form.archiveConfirmBody'),
      {
        okText: t('reward.form.archiveOk'),
        cancelText: t('reward.common.cancel'),
        destructive: true,
      },
    );
    if (!ok) return;
    try {
      await archiveReward.mutateAsync(params.id);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      Alert.alert(t('reward.form.archiveFailTitle'), msg);
    }
  };

  if (isEdit && existing.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={tokens.text.hi} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEdit ? t('reward.form.editTitle') : t('reward.form.newTitle')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.saveButton,
            (pressed || isSubmitting) && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={tokens.text.hi} size="small" />
          ) : (
            <Text style={styles.saveText}>{t('common.save')}</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + tokens.space[10] },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.field}>
            <Text style={styles.label}>{t('reward.form.categoryLabel')}</Text>
            <View style={styles.categoryRow}>
              {REWARD_CATEGORY_ORDER.map((cat) => {
                const meta = REWARD_CATEGORY_META[cat];
                const selected = cat === category;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryCell,
                      selected && {
                        borderColor: meta.color,
                        backgroundColor: meta.bg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={meta.icon as never}
                      size={18}
                      color={selected ? meta.color : tokens.text.mid}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: selected ? meta.color : tokens.text.mid },
                      ]}
                    >
                      {t(`rewards.categories.${cat}` as const)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('reward.form.titleLabel')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={t('reward.form.titlePlaceholder')}
              placeholderTextColor={tokens.text.faint}
              autoFocus={!isEdit}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('reward.form.descLabel')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.inputMultiline]}
              placeholder={t('reward.form.descPlaceholder')}
              placeholderTextColor={tokens.text.faint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('reward.form.costLabel')}</Text>
            <TextInput
              value={costStr}
              onChangeText={(v) => setCostStr(v.replace(/[^0-9]/g, ''))}
              style={styles.input}
              keyboardType="number-pad"
              placeholder="50"
              placeholderTextColor={tokens.text.faint}
            />
          </View>

          {/* Compra única. Fica colada no custo porque é a mesma pergunta —
              "quanto custa" e "quantas vezes dá pra comprar". Nasce
              desligada em qualquer categoria: categoria é proxy ruim pra
              isto (ver a migration 20260920000002). */}
          <View style={styles.field}>
            <View style={styles.oneShotRow}>
              <View style={styles.oneShotInfo}>
                <Text style={styles.oneShotTitle}>{t('reward.form.oneShotTitle')}</Text>
                <Text style={styles.oneShotSub}>{t('reward.form.oneShotSub')}</Text>
              </View>
              <Switch
                value={isOneShot}
                onValueChange={setIsOneShot}
                trackColor={{ false: tokens.bg.surface2, true: tokens.brand.violet }}
                thumbColor={tokens.text.hi}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('reward.form.iconLabel')}</Text>
            {/* Compact row that opens the picker sheet — the old inline
                36-cell grid pushed the archive button a full screen down. */}
            <Pressable
              onPress={() => {
                // Title autofocuses in create mode; drop the keyboard so
                // it can't float over/behind the transparent modal.
                Keyboard.dismiss();
                setIconPickerVisible(true);
              }}
              style={({ pressed }) => [styles.iconRow, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              // Self-contained label — the override suppresses the inner
              // text for screen readers, so bare 'Trocar' wouldn't say
              // WHAT gets changed.
              accessibilityLabel={t('common.changeIconA11y')}
            >
              <View style={styles.iconRowTile}>
                <AppIcon name={icon} size={22} color={tokens.semantic.coin} />
              </View>
              <Text style={styles.iconRowHint} numberOfLines={2}>
                {t('reward.form.iconHint')}
              </Text>
              <Text style={styles.iconRowChange}>{t('common.changeIcon')}</Text>
              <Ionicons name="chevron-forward" size={16} color={tokens.semantic.coin} />
            </Pressable>
          </View>

          {isEdit && (
            <Pressable
              onPress={handleArchive}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.archiveButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="archive-outline" size={18} color={tokens.semantic.danger} />
              <Text style={styles.archiveText}>{t('reward.form.archiveBtn')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <IconPickerModal
        visible={iconPickerVisible}
        title={t('reward.form.iconLabel')}
        value={icon}
        // No Auto cell here — rewards always carry a concrete icon
        // ('gift' default), so null never reaches setIcon.
        onSelect={(name) => {
          if (name) setIcon(name);
        }}
        onClose={() => setIconPickerVisible(false)}
        accentColor={tokens.semantic.coin}
        accentBg="rgba(255, 200, 61, 0.16)"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.base },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  headerTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  saveButton: {
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
    backgroundColor: tokens.brand.violet,
    borderRadius: tokens.radius.md,
    minWidth: 72,
    alignItems: 'center',
  },
  saveText: {
    ...tokens.type.body,
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
  },
  content: {
    padding: tokens.space[4],
    gap: tokens.space[5],
    paddingBottom: tokens.space[10],
  },
  field: {
    gap: tokens.space[2],
  },
  label: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    color: tokens.text.hi,
    ...tokens.type.bodyLg,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: tokens.space[3],
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
  },
  iconRowTile: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // Coin-gold accent — rewards palette (violet goes to práticas).
    borderColor: tokens.semantic.coin,
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
  },
  iconRowHint: {
    flex: 1,
    ...tokens.type.caption,
    color: tokens.text.dim,
  },
  iconRowChange: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.semantic.coin,
  },
  oneShotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 9,
  },
  oneShotInfo: {
    flex: 1,
  },
  oneShotTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.hi,
  },
  oneShotSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
    marginTop: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
  },
  categoryCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  categoryText: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.3,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 122, 0.3)',
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
    marginTop: tokens.space[3],
  },
  archiveText: {
    ...tokens.type.body,
    color: tokens.semantic.danger,
    fontFamily: 'Manrope_700Bold',
  },
});
