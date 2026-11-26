import React from 'react';
import { FaWhatsapp, FaSync, FaTimes, FaEnvelope, FaPhone, FaCopy } from 'react-icons/fa';
import WhatsAppButton from './WhatsAppButton';
import tenantService from '../../../services/tenantService';

const ActionButtons = ({ tenant, activeTab, onAction, loading }) => {
  const handleCopyVerificationLink = async (tenantId) => {
    try {
      const response = await tenantService.generateVerificationLink(tenantId);
      if (response.success) {
        await navigator.clipboard.writeText(response.data.whatsapp_message);
        alert('Link verifikasi berhasil disalin ke clipboard!');
      }
    } catch (error) {
      console.error('Error generating verification link:', error);
      alert('Gagal membuat link verifikasi. Silakan coba lagi.');
    }
  };

  const getTabSpecificActions = () => {
    const actionMap = {
      // ✅ COMMENTED OUT: Copy verification link (not needed anymore)
      unverified: [
        // { key: 'copyLink', label: 'Copy Link', icon: FaCopy, color: 'blue', action: () => handleCopyVerificationLink(tenant.id) }
      ],
      active_trial: [
        { key: 'viewUsage', label: 'View Usage', icon: FaSync, color: 'blue' },
        { key: 'extendTrial', label: 'Extend Trial', icon: FaSync, color: 'orange' }
      ],
      last_access_trial: [
        { key: 'sendReminder', label: 'Send Reminder', icon: FaEnvelope, color: 'orange' },
        { key: 'offerUpgrade', label: 'Offer Upgrade', icon: FaSync, color: 'blue' }
      ],
      expired_trial: [
        { key: 'renewTrial', label: 'Renew Trial', icon: FaSync, color: 'blue' },
        { key: 'offerSubscription', label: 'Offer Plan', icon: FaSync, color: 'green' }
      ],
      active: [
        { key: 'viewBilling', label: 'View Billing', icon: FaSync, color: 'blue' },
        { key: 'changePlan', label: 'Change Plan', icon: FaSync, color: 'orange' }
      ],
      last_access_subscription: [
        { key: 'renewSubscription', label: 'Renew', icon: FaSync, color: 'blue' },
        { key: 'updatePayment', label: 'Update Payment', icon: FaSync, color: 'orange' }
      ],
      expired_tenant: [
        { key: 'recoverAccount', label: 'Recover', icon: FaSync, color: 'blue' },
        { key: 'offerNewPlan', label: 'New Plan', icon: FaSync, color: 'green' }
      ]
    };

    return actionMap[activeTab] || [];
  };

  const getButtonColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white',
      orange: 'bg-orange-600 hover:bg-orange-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white'
    };
    return colorMap[color] || colorMap.gray;
  };

  const actions = getTabSpecificActions();

  return (
    <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => {
                  if (action.action) {
                    action.action();
                  } else {
                    onAction(action.key, tenant);
                  }
                }}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor(action.color)}`}
              >
                <IconComponent className="text-sm" />
                {action.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex gap-2">
          <WhatsAppButton 
            tenant={tenant} 
            activeTab={activeTab} 
            size="md"
          />
          
          <button
            onClick={() => onAction('close', tenant)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="text-sm" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;
