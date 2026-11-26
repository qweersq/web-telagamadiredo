import React, { useState } from 'react';
import { X, Crown, Coins, Phone, Pencil, UserRound, ChevronDown } from 'lucide-react';
import PhoneInputWithCountry from '../PhoneInput/PhoneInputWithCountry';
import { getMembershipBadgeColor, formatCurrency, formatNumber } from '../../utils/labelFormatter';
import instance from '../../config/api';

export const WALK_IN_CUSTOMER_NAME = 'Pelanggan Umum';

export const isWalkInCustomer = (customer) =>
  !customer || !customer.phone || customer.name === WALK_IN_CUSTOMER_NAME;

const QuickOrderCustomerSelect = ({
  selectedCustomer,
  setShowCustomerSearch,
  onRemove,
  onCustomerUpdate,
  hideLabel = false,
  pointsSettings = { enabled: false, redeem_rate: 50 },
  displayName = null, // Nama pemesan walk-in (menggantikan "Pelanggan Umum")
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);

  const guest = isWalkInCustomer(selectedCustomer);

  const handleOpenEdit = () => {
    setEditForm({
      name: selectedCustomer?.name || '',
      phone: selectedCustomer?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return;
    setIsSaving(true);
    try {
      await instance.put(`/customers/${selectedCustomer.id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      setShowEditModal(false);
      if (onCustomerUpdate) {
        onCustomerUpdate({
          ...selectedCustomer,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
        });
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const customerPoints = selectedCustomer?.points ?? 0;
  const showPoints = !guest && pointsSettings?.enabled;

  return (
    <div>
      {!hideLabel && (
        <h3 className="font-semibold text-sm mb-2 font-montserrat tracking-wide text-telaga-900">
          Pelanggan
        </h3>
      )}

      <div className="bg-white border border-telaga-100 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              guest ? 'bg-telaga-50 text-telaga-600' : 'bg-senja-50 text-senja-600'
            }`}
          >
            <UserRound className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-telaga-950 font-montserrat text-sm truncate">
                {displayName || selectedCustomer?.name || WALK_IN_CUSTOMER_NAME}
              </h4>
              {guest ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-telaga-50 text-telaga-700 border border-telaga-100">
                  Walk-in
                </span>
              ) : (
                selectedCustomer?.current_membership?.status === 'active' && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getMembershipBadgeColor(
                      selectedCustomer.current_membership.membership?.name
                    )}`}
                  >
                    <Crown className="w-2.5 h-2.5" />
                    {selectedCustomer.current_membership.membership?.name}
                  </span>
                )
              )}
            </div>

            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {!guest && selectedCustomer?.phone && (
                <span className="inline-flex items-center gap-1 text-xs text-telaga-900/60 font-montserrat">
                  <Phone className="w-3 h-3" />
                  {selectedCustomer.phone}
                </span>
              )}
              {showPoints && (
                <span className="inline-flex items-center gap-1 text-xs text-senja-600 font-montserrat font-semibold">
                  <Coins className="w-3 h-3" />
                  {formatNumber(customerPoints)} poin
                  {customerPoints > 0 && (
                    <span className="font-normal text-telaga-900/60">
                      · {formatCurrency(Math.floor((customerPoints / 100) * (pointsSettings.redeem_rate * 100)))}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!guest && (
              <button
                onClick={handleOpenEdit}
                className="p-1.5 text-telaga-900/50 hover:text-telaga-700 hover:bg-telaga-50 rounded-lg transition-colors"
                title="Edit pelanggan"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold font-montserrat text-telaga-700 bg-telaga-50 hover:bg-telaga-100 border border-telaga-100 rounded-lg transition-colors"
            >
              {guest ? 'Set Member' : 'Ganti'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {!guest && (
              <button
                onClick={onRemove}
                className="p-1.5 text-telaga-900/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Kembali ke Pelanggan Umum"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-telaga-50 via-krem to-krem">
              <h3 className="font-bold text-telaga-950 font-montserrat">Edit Pelanggan</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-telaga-100 transition-colors"
              >
                <X className="w-4 h-4 text-telaga-700" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-telaga-900/60 font-montserrat mb-1 block">
                  Nama
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-telaga-100 bg-krem rounded-xl px-3 py-2 text-sm font-montserrat text-telaga-950 focus:outline-none focus:ring-2 focus:ring-telaga-400"
                  placeholder="Nama pelanggan"
                />
              </div>
              <PhoneInputWithCountry
                value={editForm.phone}
                onChange={(v) => setEditForm((prev) => ({ ...prev, phone: v }))}
                label="No. HP"
              />
            </div>

            <div className="flex gap-3 px-5 py-4 bg-krem">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white border-2 border-telaga-100 text-telaga-700 text-sm font-semibold font-montserrat hover:bg-telaga-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-telaga-600 text-white text-sm font-semibold font-montserrat hover:bg-telaga-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickOrderCustomerSelect;
