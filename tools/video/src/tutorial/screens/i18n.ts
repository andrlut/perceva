// As strings das réplicas vêm do PRÓPRIO app (app/lib/i18n/locales), não de
// uma cópia: se o app trocar "Resgatar", o próximo render do tutorial já sai
// com a palavra nova. Os arquivos são objetos puros (só import de tipo).
import en from '../../../../../app/lib/i18n/locales/en';
import pt from '../../../../../app/lib/i18n/locales/pt';

export type Lang = 'pt' | 'en';

const CATALOGS: Record<Lang, unknown> = { pt, en };

const lookup = (lang: Lang, key: string): unknown => {
  let v: unknown = CATALOGS[lang];
  for (const part of key.split('.')) {
    if (v && typeof v === 'object' && part in (v as Record<string, unknown>)) v = (v as Record<string, unknown>)[part];
    else throw new Error(`i18n: chave inexistente "${key}" (${lang})`);
  }
  return v;
};

/** t() do app (i18n-js): {{var}} e plural { one, other } por `count`. */
export const tr = (lang: Lang, key: string, vars: Record<string, string | number> = {}): string => {
  let v = lookup(lang, key);
  if (v && typeof v === 'object') {
    const forms = v as Record<string, string>;
    v = vars.count === 1 ? forms.one : forms.other;
  }
  if (typeof v !== 'string') throw new Error(`i18n: "${key}" não é texto (${lang})`);
  return v.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''));
};

/** toLocaleString() do Hermes no aparelho: 1.500 em pt-BR, 1,500 em en-US. */
export const num = (lang: Lang, n: number) => Math.round(n).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');

/** String.toUpperCase() do app (pt-BR tem acento: INDULGÊNCIA). */
export const upper = (lang: Lang, s: string) => s.toLocaleUpperCase(lang === 'pt' ? 'pt-BR' : 'en-US');
