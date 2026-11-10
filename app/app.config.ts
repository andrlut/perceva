import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Variantes do app por ambiente. `app.json` continua sendo a config inteira
 * (é o que a Play e a App Store recebem, e é de onde o `promote-production`
 * lê a versão); este arquivo só a ESTENDE.
 *
 * - sem `APP_VARIANT`: devolve o `app.json` intacto → `perceva.app`.
 *   Builds `preview`/`production`, `eas update` e o Metro caem aqui.
 * - `APP_VARIANT=development` (perfil `development` do eas.json): o
 *   "Perceva Dev", um build de desenvolvimento com pacote PRÓPRIO, que
 *   instala AO LADO do app da Play em vez de exigir desinstalá-lo.
 *
 * O que muda no Dev por causa do pacote está anotado na PR que criou isto:
 * login com Google precisa de um client OAuth Android próprio, compras do
 * RevenueCat não carregam fora da loja, e o deep link `rpgtasks://` é o
 * mesmo dos dois apps (o Android pergunta qual abrir).
 *
 * NUNCA mexa no ramo de produção daqui: o pacote `perceva.app` tem que
 * casar com o Play Console.
 */
const IS_DEV_VARIANT = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (!IS_DEV_VARIANT) return base;

  return {
    ...base,
    name: 'Perceva Dev',
    ios: { ...base.ios, bundleIdentifier: 'perceva.app.dev' },
    android: { ...base.android, package: 'perceva.app.dev' },
  };
};
