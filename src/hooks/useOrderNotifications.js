import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';

const MIN_RETRY_MS = 2000;
const MAX_RETRY_MS = 30000;

/**
 * Klien SSE notifikasi pesanan baru.
 *
 * `EventSource` tidak bisa mengirim header, jadi token dikirim lewat query
 * string — backend (`AuthMiddleware.authenticateUser`) sudah mendukungnya.
 *
 * Reconnect ditangani manual (bukan bawaan EventSource) supaya koneksi yang
 * ditolak 401 tidak berubah jadi loop tak terkendali.
 *
 * @param {object}   options
 * @param {boolean}  options.enabled  matikan koneksi saat tidak dipakai
 * @param {Function} options.onOrder  dipanggil tiap ada pesanan baru
 */
const useOrderNotifications = ({ enabled = true, onOrder } = {}) => {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const onOrderRef = useRef(onOrder);

  useEffect(() => {
    onOrderRef.current = onOrder;
  }, [onOrder]);

  useEffect(() => {
    if (!enabled) return undefined;

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let source = null;
    let retryTimer = null;
    let attempt = 0;
    let disposed = false;

    const cleanupSource = () => {
      if (!source) return;
      source.onerror = null;
      source.close();
      source = null;
    };

    const scheduleRetry = () => {
      if (disposed) return;
      attempt += 1;
      const delay = Math.min(MAX_RETRY_MS, MIN_RETRY_MS * 2 ** (attempt - 1));
      retryTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;
      cleanupSource();

      const url = `${API_URL}/notifications/orders/stream?token=${encodeURIComponent(token)}`;
      source = new EventSource(url);

      source.addEventListener('ready', () => {
        attempt = 0;
        setConnected(true);
      });

      source.addEventListener('order:created', (event) => {
        try {
          const payload = JSON.parse(event.data);
          setLastEvent(payload);
          onOrderRef.current?.(payload);
        } catch (error) {
          console.error('⚠️ Payload notifikasi pesanan tidak valid:', error.message);
        }
      });

      source.onerror = () => {
        setConnected(false);
        cleanupSource();
        scheduleRetry();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      cleanupSource();
      setConnected(false);
    };
  }, [enabled]);

  return { connected, lastEvent };
};

export default useOrderNotifications;
