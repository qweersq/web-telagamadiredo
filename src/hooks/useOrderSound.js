import { useCallback, useEffect, useState } from 'react';
import {
  isOrderSoundEnabled,
  isOrderSoundUnlocked,
  playOrderSound,
  setOrderSoundEnabled,
  subscribeOrderSound,
  unlockOrderSound,
} from '../utils/orderSound';

/**
 * Hook pengelola bel pesanan.
 *
 * `enabled`   : user ingin mendengar bel (disimpan di localStorage)
 * `unlocked`  : browser sudah mengizinkan audio (butuh 1x gesture)
 * `play()`    : putar bel kalau enabled
 * `unlock()`  : panggil dari onClick tombol "Aktifkan suara"
 */
const useOrderSound = () => {
  const [enabled, setEnabledState] = useState(() => isOrderSoundEnabled());
  const [unlocked, setUnlocked] = useState(() => isOrderSoundUnlocked());

  useEffect(() => {
    const sync = () => {
      setEnabledState(isOrderSoundEnabled());
      setUnlocked(isOrderSoundUnlocked());
    };
    return subscribeOrderSound(sync);
  }, []);

  const toggle = useCallback(async (next) => {
    const value = typeof next === 'boolean' ? next : !isOrderSoundEnabled();
    setOrderSoundEnabled(value);
    // Sekaligus jadi gesture pembuka audio saat user menyalakan bel.
    if (value) await unlockOrderSound();
    return value;
  }, []);

  const unlock = useCallback(() => unlockOrderSound(), []);
  const play = useCallback(() => playOrderSound(), []);

  return { enabled, unlocked, setEnabled: toggle, unlock, play };
};

export default useOrderSound;
