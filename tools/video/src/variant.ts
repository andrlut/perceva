import { createContext, useContext } from 'react';

/**
 * Para onde vai este render. A mesma montagem serve as duas saídas; só o
 * cartão final muda:
 *   ad  — fixado do Insta, Reels/TikTok e anúncio: termina no CTA de download
 *   app — entrada do tutorial dentro do app: sem CTA ("Vamos começar?")
 */
export type Variant = 'ad' | 'app';
export const VariantContext = createContext<Variant>('ad');
export const useVariant = () => useContext(VariantContext);
