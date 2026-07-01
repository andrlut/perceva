/**
 * Cross-platform confirm + info dialogs.
 *
 * Old impl called `window.confirm`/`window.alert` on web and `Alert.alert`
 * on native — both look like generic OS dialogs and break the gold/violet
 * aesthetic of the app. New impl is a singleton event queue: `confirmAction`
 * and `showInfo` enqueue a request and wait for resolution; a `<ConfirmHost />`
 * mounted once at the root subscribes to the queue and renders a styled
 * `<Modal>` matching the rest of the app.
 *
 * Public API is unchanged — callers keep importing `confirmAction` /
 * `showInfo` from this module and don't notice the swap.
 */

interface ConfirmOptions {
  /** Action label (the "go ahead" button). */
  okText: string;
  /** Cancel label. */
  cancelText: string;
  /** Renders the OK button in danger color. */
  destructive?: boolean;
}

export type DialogKind = 'confirm' | 'info';

export interface DialogRequest {
  id: number;
  kind: DialogKind;
  title: string;
  message?: string;
  okText: string;
  cancelText?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

type Listener = (req: DialogRequest) => void;

let counter = 0;
const listeners = new Set<Listener>();
const pending: DialogRequest[] = [];

function emit(req: DialogRequest): void {
  if (listeners.size === 0) {
    // No host mounted yet — buffer the request and replay on subscribe.
    pending.push(req);
    return;
  }
  listeners.forEach((l) => l(req));
}

/**
 * Subscribe to dialog requests. Replays any pending requests that were
 * enqueued before the host mounted. Returns an unsubscribe function.
 */
export function subscribeDialog(cb: Listener): () => void {
  listeners.add(cb);
  // Replay any buffered requests now that we have a listener.
  while (pending.length > 0) {
    const req = pending.shift();
    if (req) cb(req);
  }
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Cross-platform confirm. Resolves true when the user picks the action,
 * false when they cancel (or dismiss).
 */
export function confirmAction(
  title: string,
  message: string,
  options: ConfirmOptions,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const id = ++counter;
    emit({
      id,
      kind: 'confirm',
      title,
      message,
      okText: options.okText,
      cancelText: options.cancelText,
      destructive: options.destructive,
      resolve,
    });
  });
}

/**
 * Cross-platform info-only alert ("Saved!", "Could not redeem", etc).
 * Single OK button. Resolves when dismissed.
 */
export function showInfo(title: string, message?: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const id = ++counter;
    emit({
      id,
      kind: 'info',
      title,
      message,
      okText: 'OK',
      resolve: () => resolve(),
    });
  });
}
