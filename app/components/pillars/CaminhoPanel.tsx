import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { GoalsPreview } from '@/components/pillars/GoalsPreview';
import { SkillsPanel } from '@/components/pillars/SkillsPanel';
import type { SkillState } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useModuleEnabled } from '@/lib/modules';
import { tokens } from '@/theme';

interface Props {
  skills: SkillState[];
}

/**
 * Desejada · Caminho — "how I get there" to Norte's "where I want to get".
 * A pure composition of the two paths that carry the user toward their
 * desired identity: Metas (deadline-bound quests) above, Skills (the
 * medal-ranked practice ladder) below. Both surfaces render verbatim; this
 * panel only frames them under one roof.
 */
export function CaminhoPanel({ skills }: Props) {
  const { t } = useT();
  const metasOn = useModuleEnabled('metas');
  return (
    <View style={styles.wrap}>
      {/* GoalsPreview self-gates on `metas`; the divider between the two
          sections only makes sense while both are visible. */}
      <GoalsPreview />
      {metasOn && <View style={styles.divider} />}

      <View style={styles.sectionHeader}>
        <Ionicons name="ribbon" size={14} color={tokens.semantic.coin} />
        <Text style={styles.sectionTitle}>{t('pillar.skills.short')}</Text>
      </View>
      <SkillsPanel skills={skills} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[3],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,200,61,0.18)',
    marginVertical: tokens.space[1],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1,
    color: tokens.semantic.coin,
    textTransform: 'uppercase',
  },
});
