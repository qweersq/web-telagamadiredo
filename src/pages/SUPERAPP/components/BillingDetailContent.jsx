import React from 'react';
import BillingInfoCard from './cards/BillingInfoCard';
import TenantInfoCard from './cards/TenantInfoCard';
import SubscriptionInfoCard from './cards/SubscriptionInfoCard';

const BillingDetailContent = ({ billing, tenant, subscription, plan }) => {
  if (!billing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
            No Billing Data
          </h3>
          <p className="text-sm text-gray-500 font-montserrat">
            Please select a billing to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Layout - 3 columns */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <BillingInfoCard billing={billing} />
        <TenantInfoCard tenant={tenant || billing.tenant} />
        <SubscriptionInfoCard 
          subscription={subscription || billing.subscription} 
          plan={plan || billing.subscription?.plan} 
        />
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="lg:hidden space-y-4">
        <BillingInfoCard billing={billing} />
        <TenantInfoCard tenant={tenant || billing.tenant} />
        <SubscriptionInfoCard 
          subscription={subscription || billing.subscription} 
          plan={plan || billing.subscription?.plan} 
        />
      </div>
    </div>
  );
};

export default BillingDetailContent;
