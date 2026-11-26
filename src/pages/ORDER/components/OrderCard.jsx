import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Info } from "lucide-react";
import dayjs from "dayjs";
import PhotoPopup from "./PhotoPopup";
import OrderStatusModal from "./OrderStatusModal";
import {
    formatCurrency,
    formatPaymentStatus,
    getPaymentStatusColors,
    PAYMENT_STATUS
} from "../../../utils/labelFormatter";

const OrderCard = ({ order, orderDetailStatusFilter = 'all' }) => {
    const navigate = useNavigate();
    const [showPhotoPopup, setShowPhotoPopup] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const allPhotos = order.photos || [];

    const isPaid = order.paymentStatus === PAYMENT_STATUS.PAID || order.payment?.status === PAYMENT_STATUS.PAID;
    const paymentStatus = order.paymentStatus || order.payment?.status || 'unpaid';

    // Jam & tanggal order (created_at, fallback ke entry_date)
    const orderTime = React.useMemo(() => {
        const raw = order.created_at || order.entry_date;
        if (!raw) return { jam: '-', tgl: '-' };
        const d = dayjs(raw);
        if (!d.isValid()) return { jam: '-', tgl: '-' };
        return { jam: d.format('HH:mm'), tgl: d.format('DD MMM YYYY') };
    }, [order.created_at, order.entry_date]);

    // Ringkasan layanan: "Tiket Dewasa x2 · Paket Resto"
    // order_details dari list API masih per-baris (1 baris = 1 unit), jadi dihitung manual.
    const servicesText = React.useMemo(() => {
        const details = order.order_details || [];
        if (details.length === 0) return 'Tidak ada layanan';

        const grouped = new Map();
        details.forEach(d => {
            const name = d.treatment?.name || d.name || 'Layanan';
            const qty = Number(d.qty) > 0 ? Number(d.qty) : 1;
            grouped.set(name, (grouped.get(name) || 0) + qty);
        });

        const list = Array.from(grouped.entries()).map(([name, qty]) => (qty > 1 ? `${name} x${qty}` : name));
        if (list.length <= 2) return list.join(' · ');
        return `${list.slice(0, 2).join(' · ')} +${list.length - 2} layanan lain`;
    }, [order.order_details]);

    const handlePhotoClick = (photoIndex) => {
        setSelectedPhotoIndex(photoIndex);
        setShowPhotoPopup(true);
    };

    const openDetail = () => navigate(`/order-detail/${order.id}`, { state: { order, from: '/orders' } });

    return (
        <div className="relative font-montserrat">
            <div
                onClick={openDetail}
                className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
                    isPaid ? 'border-telaga-100 hover:border-telaga-200' : 'border-senja-200 hover:border-senja-300'
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3">
                    {/* Jam & Tanggal */}
                    <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 sm:w-[68px] shrink-0">
                        <span className="text-base font-bold text-telaga-700 leading-none tabular-nums">
                            {orderTime.jam}
                        </span>
                        <span className="text-[11px] text-telaga-900/50 mt-0.5">{orderTime.tgl}</span>
                    </div>

                    {/* Nama + Layanan + Pencatat */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-sm sm:text-base text-telaga-900 truncate">
                                {order.customer?.name || 'Pelanggan Umum'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getPaymentStatusColors(paymentStatus)}`}>
                                {formatPaymentStatus(paymentStatus)}
                            </span>
                        </div>
                        <p className="text-xs text-telaga-900/65 truncate">{servicesText}</p>
                        <p className="text-[11px] text-telaga-900/40 truncate">
                            Dicatat: {order.creator?.name || '-'}
                        </p>
                    </div>

                    {/* Total + Detail */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <span className="text-base font-bold text-telaga-700 whitespace-nowrap">
                            {formatCurrency(order.total_price || 0)}
                        </span>
                        <button
                            onClick={e => { e.stopPropagation(); openDetail(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-telaga-600 hover:bg-telaga-700 text-white transition-all duration-200 shadow-sm active:scale-95"
                            title="Lihat Detail Pesanan"
                        >
                            <Info className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Detail</span>
                            <ChevronRight className="w-3 h-3 opacity-70" />
                        </button>

                        {/* Tombol "Cek Status" disembunyikan */}
                        {/* <button
                            onClick={e => { e.stopPropagation(); setShowStatusModal(true); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-telaga-50 border border-telaga-200 text-telaga-700 hover:bg-telaga-100 transition-all duration-200"
                            title="Cek Status Pesanan"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Cek Status</span>
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Photo Popup */}
            <PhotoPopup
                photos={allPhotos}
                isOpen={showPhotoPopup}
                onClose={() => setShowPhotoPopup(false)}
                initialIndex={selectedPhotoIndex}
            />

            {/* Order Status Modal */}
            <OrderStatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                order={order}
            />
        </div>
    );
};

export default OrderCard;
