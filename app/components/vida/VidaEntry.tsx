import { useRouter } from 'expo-router';

import { VidaEntryCard } from '@/components/vida/VidaParts';
import { useLifeVision } from '@/lib/api/lifeVision';
import { useModuleEnabled } from '@/lib/modules';

/**
 * "A vida que eu quero" on top of Eu › Desejada, above the Norte (which it
 * leaves untouched). Self-gates on the `vida` module like the Home strips:
 * off (or free) = nothing rendered and nothing fetched. With nothing written
 * yet, the card is the invitation and goes straight to the form — one tap,
 * no empty screen in between.
 */
export function VidaEntry() {
  const router = useRouter();
  const on = useModuleEnabled('vida');
  const q = useLifeVision(on);

  if (!on || q.isLoading || q.isError) return null;
  const view = q.data ?? null;

  return (
    <VidaEntryCard
      headline={view?.vision.headline}
      scenes={view?.scenes ?? null}
      onPress={() => router.push(view ? '/vida' : '/vida-form')}
    />
  );
}
