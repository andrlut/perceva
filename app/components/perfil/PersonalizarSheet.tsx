import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Emblema } from '@/components/Emblema';
import { PercevaGlyph, type PercevaPaletteName } from '@/components/PercevaGlyph';
import { useCharacter } from '@/lib/api/character';
import {
  ABOUT_MAX,
  PROFESSION_MAX,
  useSetIdentity,
  useUpdateAbout,
  useUpdateDisplayName,
} from '@/lib/api/profile';
import { DEEP_INSTRUMENT_IDS } from '@/lib/api/psych';
import { GLOW_FULL_READS, LADDER_5, useEmblemaState } from '@/lib/emblema';
import {
  DEFAULT_PALETTE,
  resolvePalette,
  PALETTE_OPTIONS,
  sameTitle,
  unlockedPalettes,
  useActiveTitle,
  useTitleOptions,
  type TitleOption,
} from '@/lib/identity';
import { useT } from '@/lib/i18n';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

const RING_TOP = LADDER_5[LADDER_5.length - 1];

/**
 * Personalizar — a folha atrás do toque no Emblema.
 *
 * Três seções e nada mais: título, paleta e órbita. Sem loja, sem moeda,
 * sem caixa aleatória. As duas paletas conquistadas são o único desbloqueio
 * do plano, e são cosmético puro — nada aqui muda o que o Emblema mede.
 *
 * Rascunho local com um botão de salvar, em vez de gravar a cada toque: as
 * três escolhas vivem no mesmo jsonb, então uma escrita só evita três
 * invalidações em sequência e deixa a pré-visualização responder na hora
 * sem ida ao servidor.
 */
export function PersonalizarSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const character = useCharacter();
  const emblema = useEmblemaState();
  const { options, loading: titlesLoading } = useTitleOptions();
  const active = useActiveTitle();
  const setIdentity = useSetIdentity();
  const updateName = useUpdateDisplayName();
  const updateAbout = useUpdateAbout();

  const identity = character.data?.profile.identity;
  const displayName = character.data?.profile.display_name ?? '';

  // `null` aqui é "sem título" de verdade. Quem responde "o usuário chegou
  // a mexer nisto?" é o `touched` — sem essa distinção, salvar sem tocar na
  // lista gravava `title: null` e apagava a escolha de quem só queria
  // trocar o nome ou a paleta.
  const [title, setTitle] = useState<TitleOption | null>(null);
  const [touched, setTouched] = useState(false);
  const [palette, setPalette] = useState<PercevaPaletteName>(DEFAULT_PALETTE);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [about, setAbout] = useState('');

  // Re-semeia o rascunho na ABERTURA, e só nela. Depender de `identity`
  // aqui parecia inofensivo e não é: a query do personagem revalida ao
  // focar a tela, e cada revalidação apagaria a escolha em andamento no
  // meio da edição.
  const seeded = useRef(false);
  useEffect(() => {
    if (!visible) {
      seeded.current = false;
      return;
    }
    // Só semeia quando os dados existem. Antes o latch era marcado na
    // primeira passada, mesmo com `options` vazio e `character` ainda
    // carregando — o rascunho nascia "sem título" e nunca se corrigia,
    // então o Salvar apagava a escolha de quem abriu a folha rápido.
    if (seeded.current || titlesLoading || !character.data) return;
    seeded.current = true;
    // Semeado pelo MESMO hook que a capa usa, e não por uma resolução
    // paralela: eram duas respostas para a mesma pergunta, e já divergiam
    // no caso do retake.
    setTitle(active);
    setTouched(false);
    setPalette(resolvePalette(identity?.palette));
    setName(character.data.profile.display_name ?? '');
    setProfession(character.data.profile.profession ?? '');
    setAbout(character.data.profile.about ?? '');
  }, [visible, titlesLoading, character.data, active, identity]);

  const unlocked = unlockedPalettes(
    identity,
    emblema.xp30,
    emblema.read30,
    emblema.instruments,
    RING_TOP,
    GLOW_FULL_READS,
    DEEP_INSTRUMENT_IDS.length,
  );

  const save = async () => {
    try {
      // O nome mora em outra coluna, então é outra escrita. Só vai quando
      // realmente mudou, para não invalidar o personagem à toa.
      const trimmed = name.trim();
      if (trimmed && trimmed !== character.data?.profile.display_name) {
        await updateName.mutateAsync(trimmed);
      }
      // Colunas próprias, escrita própria — e só quando mudou, para não
      // invalidar o personagem à toa.
      const p = character.data?.profile;
      if (
        profession.trim() !== (p?.profession ?? '') ||
        about.trim() !== (p?.about ?? '')
      ) {
        await updateAbout.mutateAsync({ profession, about });
      }
      await setIdentity.mutateAsync({
        // Só grava o título se a pessoa realmente escolheu algo aqui. Se
        // não tocou, a chave nem entra no patch e o que estava guardado
        // fica de pé.
        ...(touched
          ? { title: title ? { source: title.source, key: title.key } : null }
          : {}),
        palette,
        // Manda o valor de AGORA; quem garante que a marca só sobe é o
        // useSetIdentity, que compara com a linha fresca do servidor.
        best: { xp30: emblema.xp30, read30: emblema.read30 },
      });
      onClose();
    } catch (e) {
      showInfo(
        t('personalizar.saveError'),
        e instanceof Error ? e.message : t('common.unknownError'),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="close" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.title}>{t('personalizar.title')}</Text>
          <Pressable
            onPress={save}
            disabled={
              setIdentity.isPending || updateName.isPending ||
              updateAbout.isPending ||
              !seeded.current
            }
            style={({ pressed }) => [
              styles.saveBtn,
              (setIdentity.isPending || updateName.isPending || updateAbout.isPending) && {
                opacity: 0.5,
              },
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={8}
          >
            {setIdentity.isPending || updateName.isPending || updateAbout.isPending ? (
              <ActivityIndicator color={tokens.text.hi} size="small" />
            ) : (
              <Text style={styles.saveText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Pré-visualização — o mesmo Emblema, reagindo ao rascunho. */}
          <View style={styles.preview}>
            <Emblema
              state={emblema}
              size={96}
              rings={3}
              palette={palette}
              idSuffix="personalizar"
            />
            <View style={styles.previewText}>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || displayName}
              </Text>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {title ? title.label.toUpperCase() : t('personalizar.noTitle')}
              </Text>
              {title ? (
                <Text style={styles.previewPhrase} numberOfLines={2}>
                  {title.phrase}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── Nome ─────────────────────────────────────────────────── */}
          <Text style={styles.section}>{t('personalizar.nameSection')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoCapitalize="words"
            placeholder={t('usernameModal.placeholder')}
            placeholderTextColor={tokens.text.faint}
            style={styles.input}
            returnKeyType="done"
          />

          {/* ── Sobre você ───────────────────────────────────────────
             Contexto que o conector usa. A finalidade é dita AQUI, no
             campo, porque é o que torna o preenchimento um ato de
             consentimento: nasce vazio e nada é inferido pelo app. */}
          <Text style={styles.section}>{t('personalizar.aboutSection')}</Text>
          {/* Um rótulo por campo: o placeholder some assim que a pessoa
             começa a digitar, e sozinho ele deixava "o que você faz" vago
             demais para alguém saber por onde começar. */}
          <Text style={styles.fieldLabel}>
            {t('personalizar.professionLabel')}
          </Text>
          <TextInput
            value={profession}
            onChangeText={setProfession}
            maxLength={PROFESSION_MAX}
            placeholder={t('personalizar.professionPlaceholder')}
            placeholderTextColor={tokens.text.faint}
            style={styles.input}
            returnKeyType="next"
          />
          <Text style={styles.fieldLabel}>{t('personalizar.aboutLabel')}</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            maxLength={ABOUT_MAX}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder={t('personalizar.aboutPlaceholder')}
            placeholderTextColor={tokens.text.faint}
            style={[styles.input, styles.inputMultiline]}
          />
          <Text style={styles.hint}>
            {t('personalizar.aboutHint', {
              left: ABOUT_MAX - about.length,
            })}
          </Text>

          {/* ── Título ───────────────────────────────────────────────── */}
          <Text style={styles.section}>{t('personalizar.titleSection')}</Text>

          {!titlesLoading && options.length === 0 && (
            <Text style={styles.empty}>{t('personalizar.titleEmpty')}</Text>
          )}

          {options.map((o) => {
            const on = sameTitle(
              title ? { source: title.source, key: title.key } : null,
              o,
            );
            return (
              <Pressable
                key={`${o.source}:${o.key}`}
                onPress={() => {
                  setTitle(o);
                  setTouched(true);
                }}
                style={({ pressed }) => [
                  styles.row,
                  on && styles.rowOn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{o.label}</Text>
                  <Text style={styles.rowMeta}>
                    {t(`personalizar.source.${o.source}`)}
                  </Text>
                </View>
                {on && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={tokens.brand.violet2}
                  />
                )}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              setTitle(null);
              setTouched(true);
            }}
            style={({ pressed }) => [
              styles.row,
              styles.rowNone,
              title === null && styles.rowOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.rowMeta}>{t('personalizar.noTitle')}</Text>
          </Pressable>

          {/* ── Paleta ───────────────────────────────────────────────── */}
          <Text style={styles.section}>{t('personalizar.paletteSection')}</Text>
          <View style={styles.swatches}>
            {PALETTE_OPTIONS.map((p) => {
              const open = unlocked.has(p.name);
              const on = palette === p.name;
              return (
                <Pressable
                  key={p.name}
                  onPress={() => open && setPalette(p.name)}
                  disabled={!open}
                  style={({ pressed }) => [
                    styles.swatch,
                    on && styles.swatchOn,
                    !open && styles.swatchOff,
                    pressed && open && { opacity: 0.85 },
                  ]}
                >
                  <PercevaGlyph
                    size={38}
                    palette={p.name}
                    idSuffix={`sw-${p.name}`}
                  />
                  <Text style={styles.swatchLabel} numberOfLines={1}>
                    {open
                      ? t(`personalizar.palette.${p.name}`)
                      : t(`personalizar.unlock.${p.unlock}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.note}>{t('personalizar.note')}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  title: { ...tokens.type.h3, color: tokens.text.hi },
  saveBtn: {
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
    backgroundColor: tokens.brand.violet,
    borderRadius: tokens.radius.md,
    minWidth: 64,
    alignItems: 'center',
  },
  saveText: {
    ...tokens.type.body,
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
  },
  body: {
    padding: tokens.space[5],
    paddingBottom: tokens.space[10],
    gap: tokens.space[2],
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
    backgroundColor: 'rgba(155, 130, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.25)',
    borderRadius: tokens.radius.md,
    padding: tokens.space[3],
    marginBottom: tokens.space[3],
  },
  previewText: { flex: 1, minWidth: 0, gap: 2 },
  previewName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: tokens.text.hi,
  },
  previewTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.3,
    color: tokens.semantic.coinLight,
  },
  previewPhrase: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    color: tokens.text.mid,
  },
  section: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    marginTop: tokens.space[4],
    marginBottom: tokens.space[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  rowOn: {
    borderColor: tokens.brand.violet2,
    borderWidth: 1.5,
  },
  rowNone: {
    borderStyle: 'dashed',
  },
  input: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
    color: tokens.text.hi,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  fieldLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
    marginTop: tokens.space[2],
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: tokens.space[3],
    lineHeight: 20,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: tokens.text.dim,
    marginTop: 2,
  },
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: tokens.text.dim,
    paddingVertical: tokens.space[2],
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  rowMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
  },
  swatches: {
    flexDirection: 'row',
    gap: tokens.space[3],
  },
  swatch: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
  },
  swatchOn: {
    borderColor: tokens.brand.violet2,
    borderWidth: 1.5,
  },
  swatchOff: { opacity: 0.45 },
  swatchLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
  },
  note: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    color: tokens.text.dim,
    marginTop: tokens.space[4],
  },
});
