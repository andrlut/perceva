/**
 * Catalog + config for the Perceva push notification system.
 *
 * Two notifications per day, both conditional:
 *   - Daily Brief — recurring, fires every day at the user's chosen
 *                   hour (default 8:00).
 *   - Checkpoint — one-shot, fires at 12:30 if the user hasn't opened
 *                  the app since midnight.
 *
 * Tone is invitation, never guilt-trip. Celebrations stay in-app.
 */

export const NOTIFICATION_IDS = {
  DAILY_BRIEF: 'perceva-daily-brief',
  CHECKPOINT: 'perceva-checkpoint',
  NIGHTLY_CHECKIN: 'perceva-nightly-checkin',
} as const;

/** Route a tapped nightly check-in deep-links to. */
export const NIGHTLY_CHECKIN_ROUTE = '/mood-checkin';

/**
 * The Daily Brief and the nightly check-in times are USER SETTINGS
 * (`AppSettings.briefHour/Minute` and `dayEndHour/Minute`) — they are passed
 * into the schedulers, not read from here.
 *
 * The checkpoint stays a constant on purpose: it means "we haven't seen you
 * at midday", which is not tied to when the user wakes or winds down. It is
 * also armed for TOMORROW and cancelled on every app open, so a user-set
 * evening hour would mean it essentially never fires — a control that does
 * nothing is worse than no control.
 */
export const CHECKPOINT_HOUR = 12;
export const CHECKPOINT_MINUTE = 30;

/** AsyncStorage key for "did the user open the app today?". */
export const LAST_OPEN_KEY = '@perceva/last_open_date';

export type NotificationLocale = 'pt-BR' | 'en-US';

export interface NotificationMessage {
  title: string;
  body: string;
}

export interface MessageCatalog {
  dailyBrief: readonly NotificationMessage[];
  checkpoint: readonly NotificationMessage[];
  nightly: readonly NotificationMessage[];
}

export const MESSAGES_PT: MessageCatalog = {
  dailyBrief: [
    { title: 'Bom dia 👋', body: 'Que tal ver o que tem planejado pra hoje?' },
    { title: 'Perceva', body: 'Suas práticas de hoje estão esperando.' },
    { title: 'Novo dia, nova chance', body: 'Dá uma olhada no que te espera hoje.' },
  ],
  checkpoint: [
    { title: 'Perceva', body: 'Suas práticas te esperam. Dá uma olhada quando puder.' },
    { title: 'Ainda dá tempo', body: 'Você ainda não abriu o app hoje.' },
  ],
  // Ten, so the evening nudge does not read the same every night. One is
  // picked per scheduling run (every app open re-schedules it).
  nightly: [
    { title: 'Como foi seu dia?', body: 'Um toque pra registrar como você se sentiu hoje.' },
    { title: 'Perceva', body: 'Fim do dia — como você tá se sentindo?' },
    { title: 'Antes de dormir', body: 'De 1 a 5, como foi hoje?' },
    { title: 'Hora de fechar o dia', body: 'Com que carinha esse dia termina?' },
    { title: 'Um minuto pra você', body: 'Como você se sentiu hoje? É rapidinho.' },
    { title: 'Check-in da noite', body: 'Conta pro Perceva como foi o seu dia.' },
    { title: 'E aí, como foi?', body: 'Registra o humor de hoje antes de o dia acabar.' },
    { title: 'O dia tá acabando', body: 'Qual foi o tom do seu dia?' },
    { title: 'Pausa rápida', body: 'Respira e marca como você tá agora.' },
    { title: 'Seu diário te espera', body: 'Uma nota, duas palavras ou só a carinha do dia.' },
  ],
};

export const MESSAGES_EN: MessageCatalog = {
  dailyBrief: [
    { title: 'Good morning 👋', body: "What's planned for you today?" },
    { title: 'Perceva', body: "Today's practices are waiting for you." },
    { title: 'New day, new start', body: 'Take a look at what lies ahead today.' },
  ],
  checkpoint: [
    { title: 'Perceva', body: 'Your practices are waiting. Check in when you can.' },
    { title: 'Still time left', body: "You haven't opened the app yet today." },
  ],
  nightly: [
    { title: 'How was your day?', body: 'One tap to log how you felt today.' },
    { title: 'Perceva', body: 'End of the day — how are you feeling?' },
    { title: 'Before bed', body: 'From 1 to 5, how was today?' },
    { title: 'Time to close the day', body: 'What face does today end with?' },
    { title: 'A minute for you', body: 'How did you feel today? It takes a second.' },
    { title: 'Evening check-in', body: 'Tell Perceva how your day went.' },
    { title: 'So, how was it?', body: "Log today's mood before the day is over." },
    { title: 'The day is winding down', body: 'What was the tone of your day?' },
    { title: 'Quick pause', body: 'Breathe, and mark how you are right now.' },
    { title: 'Your journal is waiting', body: "A note, two words, or just the day's face." },
  ],
};

/** Random pick — one per scheduling call, fixed at schedule time. */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
