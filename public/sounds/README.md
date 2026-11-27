# Suara notifikasi

`order-bell.mp3` — bel yang diputar saat ada pesanan baru masuk di beranda
dapur, kasir, dan antrian kasir.

Ganti file ini kalau ingin suara lain. Nama file harus tetap `order-bell.mp3`
(lihat `ORDER_SOUND_SRC` di `src/utils/orderSound.js`).

Kalau file dihapus, aplikasi otomatis memakai bel sintetis bawaan browser
(dua nada pendek) sehingga notifikasi tetap berbunyi.
