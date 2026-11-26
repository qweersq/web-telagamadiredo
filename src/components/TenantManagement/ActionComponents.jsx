import { FaCopy, FaWhatsapp, FaEye, FaEdit, FaTrash, FaClock, FaCreditCard, FaChartLine, FaArchive, FaDownload, FaExclamationTriangle, FaPhone, FaHistory, FaCog, FaMoneyBillWave, FaGift, FaUserTimes } from 'react-icons/fa';

// Action Components untuk setiap action
export const ACTION_COMPONENTS = {
  copyLink: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('copyLink', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="Copy Verification Link"
    >
      <FaCopy className="text-sm" />
    </button>
  ),

  whatsapp: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('whatsapp', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="Send WhatsApp"
    >
      <FaWhatsapp className="text-sm" />
    </button>
  ),

  view: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('view', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="View Details"
    >
      <FaEye className="text-sm" />
    </button>
  ),

  edit: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('edit', tenant)}
      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
      title="Edit Tenant"
    >
      <FaEdit className="text-sm" />
    </button>
  ),

  delete: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('delete', tenant)}
      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
      title="Delete Tenant"
    >
      <FaTrash className="text-sm" />
    </button>
  ),

  extend: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('extend', tenant)}
      className="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors"
      title="Extend Trial"
    >
      <FaClock className="text-sm" />
    </button>
  ),

  convert: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('convert', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="Convert to Subscription"
    >
      <FaCreditCard className="text-sm" />
    </button>
  ),

  contact: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('contact', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="Contact Tenant"
    >
      <FaPhone className="text-sm" />
    </button>
  ),

  urgentContact: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('urgentContact', tenant)}
      className="p-1.5 text-orange-500 hover:text-orange-600 transition-colors"
      title="Urgent Contact"
    >
      <FaExclamationTriangle className="text-sm" />
    </button>
  ),

  viewActivity: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('viewActivity', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="View Activity"
    >
      <FaChartLine className="text-sm" />
    </button>
  ),

  reengage: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('reengage', tenant)}
      className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
      title="Re-engage Tenant"
    >
      <FaPhone className="text-sm" />
    </button>
  ),

  offerExtension: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('offerExtension', tenant)}
      className="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors"
      title="Offer Extension"
    >
      <FaGift className="text-sm" />
    </button>
  ),

  viewHistory: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('viewHistory', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="View History"
    >
      <FaHistory className="text-sm" />
    </button>
  ),

  archive: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('archive', tenant)}
      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      title="Archive Tenant"
    >
      <FaArchive className="text-sm" />
    </button>
  ),

  manageSubscription: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('manageSubscription', tenant)}
      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
      title="Manage Subscription"
    >
      <FaCog className="text-sm" />
    </button>
  ),

  viewBilling: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('viewBilling', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="View Billing"
    >
      <FaMoneyBillWave className="text-sm" />
    </button>
  ),

  support: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('support', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="Customer Support"
    >
      <FaPhone className="text-sm" />
    </button>
  ),

  upgradeDowngrade: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('upgradeDowngrade', tenant)}
      className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors"
      title="Upgrade/Downgrade Plan"
    >
      <FaCreditCard className="text-sm" />
    </button>
  ),

  renewalReminder: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('renewalReminder', tenant)}
      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
      title="Send Renewal Reminder"
    >
      <FaClock className="text-sm" />
    </button>
  ),

  autoRenewal: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('autoRenewal', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="Set Auto-renewal"
    >
      <FaCog className="text-sm" />
    </button>
  ),

  paymentSupport: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('paymentSupport', tenant)}
      className="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors"
      title="Payment Support"
    >
      <FaMoneyBillWave className="text-sm" />
    </button>
  ),

  retentionOffer: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('retentionOffer', tenant)}
      className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
      title="Retention Offer"
    >
      <FaGift className="text-sm" />
    </button>
  ),

  winBack: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('winBack', tenant)}
      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
      title="Win Back Campaign"
    >
      <FaUserTimes className="text-sm" />
    </button>
  ),

  analyzeChurn: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('analyzeChurn', tenant)}
      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
      title="Analyze Churn"
    >
      <FaChartLine className="text-sm" />
    </button>
  ),

  exportData: ({ tenant, onAction }) => (
    <button
      onClick={() => onAction('exportData', tenant)}
      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      title="Export Data"
    >
      <FaDownload className="text-sm" />
    </button>
  )
};
