import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { getTenantWhatsAppUrl } from '../../../utils/waTemplates';

const WhatsAppButton = ({ tenant, activeTab, className = '', size = 'sm' }) => {
  if (!tenant || !tenant.phone) {
    return null;
  }

  const whatsappUrl = getTenantWhatsAppUrl(tenant, activeTab);
  
  if (!whatsappUrl) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 
        bg-green-500 hover:bg-green-600 
        text-white font-medium rounded-lg 
        transition-colors duration-200
        ${sizeClasses[size]}
        ${className}
      `}
      title="Chat via WhatsApp"
    >
      <FaWhatsapp className={iconSizes[size]} />
      <span>Chat WA</span>
    </button>
  );
};

export default WhatsAppButton;
