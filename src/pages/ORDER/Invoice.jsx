import React, { useState, useEffect } from 'react';
import LordIcon from '../../components/Design/LordIcon';
import AnimatedButton from '../../components/Design/AnimatedButton';

// Digital Invoice Page - Consistent Design with Animated Icon Header
const Invoice = () => {
  // State untuk modal gambar
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhotos, setModalPhotos] = useState([]); // array foto
  const [modalIndex, setModalIndex] = useState(0); // index foto aktif
  const [zoomed, setZoomed] = useState(false); // zoom state

  useEffect(() => {
    document.title = 'Invoice NotaSepatu';
    return () => { document.title = 'NotaSepatu'; };
  }, []);

  // Dummy staff dan estimasi selesai
  const staffName = 'Dewi';
  const getEstimate = (item) => item.estimate || '08 Juli 2025';

  // State untuk progress popover
  const [progressOpenIdx, setProgressOpenIdx] = useState(null);

  // Placeholder for order data (to be replaced with real data/fetch)
  const orderData = {
    customer: { name: 'Kak Hadad', address: 'Jl. Mawar No. 123, Malang' },
    payment: { code: 'INV-20240601-001', payment_details: [
      { method: 'QRIS', amount: 50000 },
      { method: 'Cash', amount: 20000 }
    ], status: 'lunas' },
    entry_date: '2025-07-06T10:30:00',
    order_details: [
      {
        treatment: { name: 'Cuci Sepatu', price: 35000 },
        process_time: 'same_day',
        discount: null,
        items: [
          {
            name: 'Sepatu Converse',
            shoes_photos: [
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=200&q=80' },
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=201&q=80' }
            ],
            notes: 'Noda kuning di sol',
          },
          {
            name: 'Sepatu Vans',
            shoes_photos: [
              { url_photo: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=202&q=80' }
            ],
            notes: '',
          }
        ]
      },
      {
        treatment: { name: 'Repaint', price: 80000 },
        process_time: 'regular',
        discount: { type: 'nominal', discount: 10000 },
        items: [
          {
            name: 'Sepatu Nike',
            shoes_photos: [],
            notes: 'Repaint warna biru',
          }
        ]
      }
    ]
  };

  // Format tanggal masuk: 06 Juli 2025
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // Format harga
  const formatNumber = (num) => {
    return Number(num).toLocaleString('id-ID');
  };

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'Tidak Diketahui';
    
    const methodMap = {
      'cash': 'Tunai',
      'qris': 'QRIS',
      'bank_transfer': 'Transfer Bank',
      'transfer': 'Transfer Bank',
      'bank': 'Transfer Bank'
    };
    
    return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  // Hitung harga final per item (sederhana, tanpa diskon bertingkat)
  const calculateFinalPricePerItem = (group) => {
    const base = Number(group.treatment?.price || 0);
    let processTimeCost = 0;
    if (group.process_time === 'next_day') processTimeCost = base * 0.5;
    if (group.process_time === 'same_day') processTimeCost = base * 1.0;
    let afterProcess = base + processTimeCost;
    const discount = group.discount;
    if (discount && discount.type) {
      const discVal = Number(discount.discount || discount.value || 0);
      if (discount.type === 'percent') {
        afterProcess = afterProcess - (afterProcess * (discVal / 100));
      } else if (discount.type === 'nominal') {
        afterProcess = afterProcess - discVal;
      }
    }
    return Math.max(0, Math.round(afterProcess));
  };

  // Handler buka modal gambar
  const openPhotoModal = (photos, idx) => {
    setModalPhotos(photos);
    setModalIndex(idx);
    setZoomed(false);
    setModalOpen(true);
  };

  // Handler tutup modal
  const closeModal = () => {
    setModalOpen(false);
    setModalPhotos([]);
    setModalIndex(0);
    setZoomed(false);
  };

  // Navigasi gambar di modal
  const goPrev = (e) => {
    e.stopPropagation();
    setModalIndex((prev) => (prev === 0 ? modalPhotos.length - 1 : prev - 1));
    setZoomed(false);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setModalIndex((prev) => (prev === modalPhotos.length - 1 ? 0 : prev + 1));
    setZoomed(false);
  };

  // Toggle zoom
  const toggleZoom = (e) => {
    e.stopPropagation();
    setZoomed((z) => !z);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 sm:px-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #fff' }}>
      {/* Modal Preview Gambar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 w-full justify-center mb-2">
              <button onClick={goPrev} className="p-2 text-gray-400 hover:text-blue-500"><svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <div className="flex-1 flex justify-center items-center">
                {modalPhotos[modalIndex] && (
                  <img
                    src={modalPhotos[modalIndex].url_photo}
                    alt={`Preview ${modalIndex+1}`}
                    className={`rounded-lg object-contain transition-all duration-300 ${zoomed ? 'cursor-zoom-out max-h-[80vh] scale-125' : 'cursor-zoom-in max-h-72 scale-100'}`}
                    style={{ maxWidth: zoomed ? '90vw' : '320px', width: '100%' }}
                    onClick={toggleZoom}
                  />
                )}
              </div>
              <button onClick={goNext} className="p-2 text-gray-400 hover:text-blue-500"><svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            </div>
            <div className="text-center text-xs text-gray-400 mb-4">{modalIndex+1} / {modalPhotos.length}</div>
            <AnimatedButton
              variant="blue"
              className="w-full mt-2 py-2 text-base"
              onClick={closeModal}
            >
              Tutup
            </AnimatedButton>
          </div>
        </div>
      )}
      <div className="w-full sm:w-[420px] my-8 bg-white rounded-3xl outline outline-2 outline-[#EEF1F7] shadow-md overflow-y-auto max-h-screen scrollbar-thin scrollbar-thumb-gray-300 flex flex-col justify-between">
        {/* Gradient Header with Animated Icon */}
        <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] px-6 py-7 text-center mb-0">
          {/* Animated LordIcon (checkmark) */}
          <div className="flex justify-center mb-2">
            <LordIcon
              src="https://cdn.lordicon.com/egiwmiit.json"
              trigger="loop"
              colors="primary:#ffffff,secondary:#7BD1FD"
              stroke="bold"
              style={{ width: 48, height: 48 }}
            />
          </div>
          <h2 className="text-lg font-semibold sm:text-3xl font-montserrat font-normal text-white tracking-wide mb-1 drop-shadow">NAMA_BISNIS</h2>
          <div className="text-base sm:text-lg font-montserrat font-semibold text-white drop-shadow">PREMIUM SHOES TREATMENT</div>
          <div className="text-xs sm:text-sm text-blue-100 mt-2 font-montserrat leading-tight">
            Jl Grindulu No 24, Bunulrejo<br/>
            Kec. Blimbing, Kota Malang<br/>
            Telp: 0877-9545-2475
          </div>
        </div>
        {/* Info invoice otomatis */}
        <div className="px-6 pt-6 pb-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-montserrat mb-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#E3EAFD"/><path d="M12 8v4" stroke="#5096FC" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#5096FC"/></svg>
            Invoice ini dibuat otomatis oleh sistem pada {new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {/* Customer Info Section + Staff */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between text-base sm:text-lg font-montserrat font-semibold text-gray-800 mb-2">
            <span className="truncate max-w-[60%]">{orderData?.payment?.code || '-'}</span>
            <span className="whitespace-nowrap">{formatDate(orderData?.entry_date)}</span>
          </div>
          <div className="text-lg sm:text-xl font-montserrat font-bold text-gray-900 mb-1">
            {orderData?.customer?.name || '-'}
          </div>
          <div className="text-sm sm:text-base text-gray-600 font-montserrat mb-1">
            {orderData?.customer?.address || '-'}
          </div>
          {/* Staff/CS */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-montserrat mb-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#5096FC" strokeWidth="1.5"/><path d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="#5096FC" strokeWidth="1.5"/></svg>
            <span>Staff: <span className="font-semibold text-blue-700">{staffName}</span></span>
          </div>
        </div>
        {/* Order Details Section */}
        <div className="px-6 pt-2 pb-4">
          <div className="text-base font-montserrat font-semibold text-gray-700 mb-2">Detail Pesanan</div>
          <div className="flex flex-col gap-6">
            {orderData.order_details.map((group, idx) => {
              const finalPrice = calculateFinalPricePerItem(group);
              const qty = group.items.length;
              const total = finalPrice * qty;
              const processLabel = group.process_time && group.process_time !== 'regular'
                ? group.process_time.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                : null;
              return (
                <div key={idx} className="bg-[#F7FAFF] rounded-xl p-4 shadow-sm border border-[#E3EAFD]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <div className="font-montserrat font-bold text-gray-800 text-base">
                      {group.treatment?.name} {processLabel && <span className="ml-2 text-xs font-normal text-blue-500 bg-blue-100 rounded px-2 py-0.5">{processLabel}</span>}
                    </div>
                    <div className="text-sm font-montserrat text-gray-500">
                      {qty} item &bull; Rp{formatNumber(finalPrice)} /item
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between mb-2">
                    <div className="text-xs font-montserrat text-gray-500">
                      Total
                    </div>
                    <div className="text-base font-montserrat font-semibold text-gray-800">
                      Rp{formatNumber(total)}
                    </div>
                  </div>
                  {/* List Items */}
                  <div className="flex flex-col gap-4 mt-2">
                    {group.items.map((item, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-[#E3EAFD] flex flex-col sm:flex-row gap-3 items-start sm:items-center relative">
                        {/* Info utama kiri */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-montserrat font-medium text-gray-700 text-base truncate">{item.name || `Item ${i+1}`}</div>
                            {item.notes && <div className="text-xs text-gray-400 font-montserrat italic">{item.notes}</div>}
                          </div>
                          {/* Estimasi selesai */}
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-montserrat">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#5096FC" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="#5096FC" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Estimasi selesai: <span className="font-semibold">{getEstimate(item)}</span>
                          </div>
                        </div>
                        {/* Foto satu row */}
                        {item.shoes_photos && item.shoes_photos.length > 0 && (
                          <div className="flex gap-2 mt-1 flex-nowrap overflow-x-auto max-w-full">
                            {item.shoes_photos.slice(0,3).map((photo, pidx) => (
                              <img
                                key={pidx}
                                src={photo.url_photo}
                                alt={`Foto ${item.name || i+1}`}
                                className="w-14 h-14 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer flex-shrink-0"
                                onClick={() => openPhotoModal(item.shoes_photos, pidx)}
                              />
                            ))}
                            {item.shoes_photos.length > 3 && (
                              <div className="w-14 h-14 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-500 font-montserrat flex-shrink-0">+{item.shoes_photos.length - 3} foto lainnya</div>
                            )}
                          </div>
                        )}
                        {/* Progress button di bawah gambar */}
                        <div className="mt-3 w-full">
                          <button
                            className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 font-montserrat shadow-sm border border-blue-100"
                            onClick={() => setProgressOpenIdx(progressOpenIdx === `${idx}-${i}` ? null : `${idx}-${i}`)}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#5096FC" strokeWidth="1.5"/><path d="M12 8v4l2 2" stroke="#5096FC" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Cek Progress
                          </button>
                        </div>
                        {/* Progress popover/modal */}
                        {progressOpenIdx === `${idx}-${i}` && (
                          <div className="absolute z-40 top-full left-0 bg-white border border-blue-100 rounded-lg shadow-lg p-4 min-w-[180px] text-xs text-gray-700 font-montserrat animate-fade-in mt-2">
                            <div className="mb-2 font-semibold text-blue-700">Progress Item</div>
                            <div>Status: <span className="font-bold text-green-600">Sedang Dikerjakan</span></div>
                            <div>Estimasi selesai: <span className="font-semibold">{getEstimate(item)}</span></div>
                            <button className="mt-3 text-xs text-blue-500 underline" onClick={() => setProgressOpenIdx(null)}>Tutup</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Payment Section - Redesain Modern */}
        <div className="px-6 pt-2 pb-4">
          <div className="text-base font-montserrat font-bold text-gray-800 mb-3">Pembayaran</div>
          <div className="flex flex-col gap-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-montserrat font-bold text-gray-900">
              <span>Total</span>
              <span>Rp{Number(orderData.payment?.subtotal || 70000).toLocaleString('id-ID')}</span>
            </div>
            {/* Sudah dibayar */}
            <div className="flex items-center justify-between text-base font-montserrat font-semibold text-blue-700">
              <span>Sudah Dibayar</span>
              <span>Rp{Number((orderData.payment?.payment_details || []).reduce((a, b) => a + Number(b.amount || 0), 0)).toLocaleString('id-ID')}</span>
            </div>
            {/* Sisa bayar */}
            {(() => {
              const subtotal = Number(orderData.payment?.subtotal || 70000);
              const paid = Number((orderData.payment?.payment_details || []).reduce((a, b) => a + Number(b.amount || 0), 0));
              const sisa = subtotal - paid;
              if (sisa > 0) {
                return (
                  <div className="flex items-center justify-between text-base font-montserrat font-semibold">
                    <span className="text-red-700">Sisa Bayar</span>
                    <span className="bg-red-100 text-red-700 rounded px-3 py-1 text-lg font-bold">Rp{sisa.toLocaleString('id-ID')}</span>
                  </div>
                );
              } else {
                return null;
              }
            })()}
            {/* Divider */}
            <div className="w-full border-t border-dashed border-blue-100 my-2"></div>
            {/* History pembayaran */}
            <div className="flex flex-col gap-2 mt-1">
              {(orderData.payment?.payment_details || []).map((pay, idx) => {
                // Debug logging
                const paymentMethod = pay.transaction?.finance_account?.name || pay.payment_method_code || pay.payment_method_name || pay.method;
                const formattedMethod = formatPaymentMethod(paymentMethod);
                console.log('🔍 Frontend Payment Method Debug:', {
                  originalMethod: pay.method,
                  financeAccountName: pay.transaction?.finance_account?.name,
                  paymentMethodCode: pay.payment_method_code,
                  paymentMethodName: pay.payment_method_name,
                  finalMethod: paymentMethod,
                  formattedMethod: formattedMethod
                });
                
                return (
                <div key={idx} className="flex items-center justify-between bg-blue-50/60 rounded-lg px-4 py-2 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    {/* Icon metode */}
                    {(() => {
                      const methodCode = pay.transaction?.finance_account?.name || pay.payment_method_code || pay.payment_method_name || pay.method;
                      if (methodCode?.toLowerCase().includes('qris')) {
                        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#5096FC"/><path d="M7 8.5h10M7 12h6" stroke="#fff" strokeWidth="1.5"/></svg>;
                      }
                      if (methodCode?.toLowerCase().includes('cash') || methodCode?.toLowerCase().includes('tunai')) {
                        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#25D366"/><path d="M7 12h10M7 16h6" stroke="#fff" strokeWidth="1.5"/></svg>;
                      }
                      if (methodCode?.toLowerCase().includes('bank') || methodCode?.toLowerCase().includes('transfer')) {
                        return <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#3B82F6"/><path d="M7 12h10M7 16h6" stroke="#fff" strokeWidth="1.5"/></svg>;
                      }
                      return <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#6B7280"/><path d="M7 12h10M7 16h6" stroke="#fff" strokeWidth="1.5"/></svg>;
                    })()}
                    <span className="inline-block px-2 py-0.5 rounded bg-white text-blue-700 text-xs font-semibold font-montserrat uppercase border border-blue-200">
                      {formatPaymentMethod(pay.transaction?.finance_account?.name || pay.payment_method_code || pay.payment_method_name || pay.method)}
                    </span>
                  </div>
                  <div className="font-montserrat font-bold text-gray-900 text-base">Rp{Number(pay.amount).toLocaleString('id-ID')}</div>
                </div>
                );
              })}
            </div>
            {/* Status pembayaran */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-xs text-gray-500 font-montserrat">Status</span>
              <span className={`text-base font-bold font-montserrat rounded px-4 py-2 ${orderData.payment?.status === 'paid' || orderData.payment?.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {orderData.payment?.status === 'paid' || orderData.payment?.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
          </div>
        </div>
        {/* Footer Invoice - Clean Modern */}
        <div className="px-6 pb-8 pt-2">
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col items-center text-center shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#E3EAFD"/><path d="M8.5 12.5c.5 1 1.5 2 2.5 2.5.5.5 1.5.5 2 0l.5-.5c.5-.5.5-1.5 0-2l-1-1c-.5-.5-1.5-.5-2 0l-.5.5c-.5.5-.5 1.5 0 2Z" stroke="#5096FC" strokeWidth="1.5"/></svg>
              <span className="text-xs text-gray-600 font-montserrat">Garansi 24 Jam Cuci / 1 Bulan Repair</span>
            </div>
            <div className="text-sm font-montserrat text-gray-700 mb-3">Terima kasih telah mempercayakan sepatu Anda.</div>
            <div className="flex gap-3 mt-1">
              <a href="https://instagram.com/katsikat.id" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-blue-100 transition">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#5096FC"/><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" fill="#fff"/><circle cx="16.5" cy="7.5" r="1" fill="#fff"/></svg>
              </a>
              <a href="https://wa.me/6287795452475" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-100 transition">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#25D366"/><path d="M16.5 13.5c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.1-.5.7-.7.8-.1.1-.3.1-.5 0-.2-.1-.8-.3-1.5-1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.3.1-.1.1-.2.2-.3.1-.1.1-.2.1-.3 0-.1 0-.2-.1-.3-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3-.1 0-.2 0-.3 0-.1 0-.3 0-.4.2-.1.2-.5.5-.5 1.2 0 .7.5 1.4.6 1.5.1.1 1.1 1.7 2.7 2.3 1.6.6 1.6.4 1.9.4.3 0 .9-.3 1-.7.1-.4.1-.7.1-.7 0-.1-.1-.1-.2-.2Z" fill="#fff"/></svg>
              </a>
            </div>
          </div>
        </div>
        {/* Safe area bawah untuk iPhone/browser modern */}
        <div className="pb-safe pb-8 mb-20" />
      </div>
    </div>
  );
};

export default Invoice; 