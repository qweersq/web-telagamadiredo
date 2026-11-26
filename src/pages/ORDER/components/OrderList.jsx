import React from "react";
import OrderCard from "./OrderCard";

const OrderList = ({
    orders,
    loading,
    orderDetailStatusFilter = 'all',
    hasMore = false,
    isLoadingMore = false,
    onLoadMore = null,
    totalItems = 0,
    currentPage = 1,
    totalPages = 0
}) => {

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading orders...</div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-2 font-montserrat">Tidak ada order ditemukan</div>
                <button
                    onClick={() => {
                        setShowQuickInput(true);
                    }}
                    className="text-blue-500 hover:text-blue-600 font-montserrat"
                >
                    Buat order pertama
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="space-y-2.5 p-3 sm:p-4 pb-8">
                {/* Order cards */}
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        orderDetailStatusFilter={orderDetailStatusFilter}
                    />
                ))}

                {/* Loading more indicator */}
                {isLoadingMore && (
                    <div className="flex justify-center items-center py-6">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <span className="text-sm text-gray-600 font-montserrat">Memuat order...</span>
                        </div>
                    </div>
                )}

                {/* Load More Button */}
                {hasMore && !isLoadingMore && currentPage < totalPages && (
                    <div className="text-center py-6">
                        <button
                            onClick={() => {
                                onLoadMore && onLoadMore();
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-xl font-semibold hover:from-[#4088EB] hover:to-[#6BC1ED] shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 font-montserrat"
                        >
                            Muat Lebih Banyak
                        </button>
                        <p className="text-xs text-gray-500 mt-2 font-montserrat">
                            Halaman {currentPage} dari {totalPages} • {orders.length} dari {totalItems} order
                        </p>
                    </div>
                )}

                {/* End of list indicator */}
                {!hasMore && orders.length > 0 && (
                    <div className="text-center py-6">
                        <div className="text-sm text-gray-500 font-montserrat">
                            Semua order telah dimuat ({totalItems} order)
                        </div>
                    </div>
                )}

                {/* Extra space at bottom to prevent cutoff */}
                <div className="pb-8"></div>
            </div>
        </div>
    );
};

export default React.memo(OrderList);