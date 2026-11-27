import { useCallback, useEffect, useRef, useState } from 'react';
import useOrderNotifications from './useOrderNotifications';
import useOrderSound from './useOrderSound';
import { getUserData } from '../utils/userProfileHelper';

const TOAST_DURATION_MS = 15000;

// Payload bisa membawa createdAt yang tidak valid (mis. objek literal dari backend).
const toValidIso = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
};

const buildToast = (payload) => {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const names = items.map((item) => item?.name).filter(Boolean);
  const uniqueNames = [...new Set(names)];

  return {
    id: `${payload?.orderId ?? 'x'}-${Date.now()}`,
    orderId: payload?.orderId ?? null,
    orderCode: payload?.orderCode || null,
    customerName: payload?.customerName || null,
    tableNumber: payload?.tableNumber || null,
    sellingBranchName: payload?.sellingBranchName || null,
    summary: uniqueNames.slice(0, 3).join(', ') + (uniqueNames.length > 3 ? ` +${uniqueNames.length - 3} lainnya` : ''),
    totalAmount: payload?.totalAmount ?? 0,
    createdAt: toValidIso(payload?.createdAt),
  };
};

/**
 * Gabungan notifikasi SSE + bel + daftar toast pesanan masuk.
 *
 * Dipakai beranda operasional (dapur, kasir, antrian) supaya langsung tahu
 * ada pesanan baru tanpa menunggu polling berikutnya.
 *
 * @param {object}   options
 * @param {boolean}  options.enabled   matikan seluruh fitur
 * @param {Function} options.onRefresh dipanggil (debounced) saat ada pesanan baru
 */
const useOrderAlert = ({ enabled = true, onRefresh } = {}) => {
  const sound = useOrderSound();
  const [toasts, setToasts] = useState([]);
  const userIdRef = useRef(null);
  const timersRef = useRef(new Map());
  const refreshRef = useRef(onRefresh);
  const soundRef = useRef(sound);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    let cancelled = false;
    getUserData()
      .then((user) => {
        if (!cancelled) userIdRef.current = user?.id ?? null;
      })
      .catch(() => {
        // profil gagal diambil: anggap tidak ada user, bel tetap jalan
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const handleOrder = useCallback(
    (payload) => {
      // Jangan bunyi untuk pesanan yang dibuat sendiri dari perangkat ini.
      const createdBy = Number(payload?.createdBy);
      if (createdBy && userIdRef.current && createdBy === Number(userIdRef.current)) {
        return;
      }

      soundRef.current?.play();

      const toast = buildToast(payload);
      setToasts((prev) => [toast, ...prev].slice(0, 4));

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        timersRef.current.delete(toast.id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(toast.id, timer);

      // Segarkan daftar tanpa menunggu interval polling.
      try {
        refreshRef.current?.(payload);
      } catch (error) {
        console.error('⚠️ Gagal refresh setelah notifikasi pesanan:', error.message);
      }
    },
    []
  );

  const { connected } = useOrderNotifications({ enabled, onOrder: handleOrder });

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  return { connected, toasts, dismissToast: dismiss, sound };
};

export default useOrderAlert;
