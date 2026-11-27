/**
 * Bel notifikasi pesanan baru.
 *
 * Browser modern (Chrome/Safari) memblokir audio yang diputar tanpa interaksi
 * user lebih dulu. Karena itu audio perlu "dibuka" sekali lewat gesture
 * (klik tombol "Aktifkan suara"), setelah itu `play()` boleh dipanggil dari
 * mana saja termasuk dari event SSE.
 *
 * Sumber suara:
 * 1. `web/public/sounds/order-bell.mp3` — dipakai kalau file tersedia.
 * 2. Bel sintetis (Web Audio API) — fallback otomatis kalau file mp3 belum
 *    ada, jadi fitur tetap berbunyi tanpa perlu aset tambahan.
 */

export const ORDER_SOUND_SRC = '/sounds/order-bell.mp3';

const STORAGE_KEY = 'orderSoundEnabled';

// Dua nada singkat, mirip notifikasi chat masuk.
const CHIME_FREQUENCIES = [880, 1174.66];

let audioEl = null;
let audioCtx = null;
let unlocked = false;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // listener rusak tidak boleh menghentikan yang lain
    }
  });
};

const getAudio = () => {
  if (audioEl) return audioEl;
  audioEl = new Audio(ORDER_SOUND_SRC);
  audioEl.preload = 'auto';
  return audioEl;
};

const getAudioContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

const playChime = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') await ctx.resume();
  } catch {
    return false;
  }
  if (ctx.state !== 'running') return false;

  const now = ctx.currentTime;
  CHIME_FREQUENCIES.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + index * 0.18;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.55);
  });

  unlocked = true;
  return true;
};

export const isOrderSoundEnabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setOrderSoundEnabled = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // private mode: biarkan saja, tetap jalan untuk sesi ini
  }
  notify();
};

export const isOrderSoundUnlocked = () => unlocked;

/**
 * Buka kunci audio. Harus dipanggil dari dalam handler gesture user
 * (onClick / onPointerDown), bukan dari setTimeout / efek async.
 */
export const unlockOrderSound = async () => {
  // AudioContext juga butuh gesture, jadi dibuka di sini sekalian.
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // abaikan, mp3 masih mungkin berbunyi
    }
  }

  const audio = getAudio();
  const previousVolume = audio.volume;
  audio.volume = 0;

  try {
    const result = audio.play();
    if (result && typeof result.then === 'function') {
      await result;
    }
    audio.pause();
    audio.currentTime = 0;
    unlocked = true;
    return true;
  } catch {
    // File mp3 belum ada: cukup andalkan bel sintetis.
    unlocked = Boolean(ctx) && ctx.state === 'running';
    return unlocked;
  } finally {
    audio.volume = previousVolume;
    notify();
  }
};

/**
 * Putar bel. Aman dipanggil kapan saja — kegagalan hanya di-log.
 * @returns {Promise<boolean>} true kalau bel benar-benar berbunyi
 */
export const playOrderSound = async () => {
  if (!isOrderSoundEnabled()) return false;

  const audio = getAudio();
  try {
    audio.currentTime = 0;
    await audio.play();
    unlocked = true;
    notify();
    return true;
  } catch (error) {
    if (error?.name === 'NotAllowedError') {
      // Belum ada gesture user — jangan spam console.
      return false;
    }
    // File mp3 tidak ada / format tidak didukung → pakai bel sintetis.
    const ok = await playChime();
    if (ok) notify();
    return ok;
  }
};

/**
 * Berlangganan perubahan status (enabled / unlocked) agar semua komponen
 * yang memakai hook ikut ter-update tanpa reload.
 */
export const subscribeOrderSound = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
