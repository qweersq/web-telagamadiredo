import React from 'react';
import UnverifiedContent from './TabContents/UnverifiedContent';
import ActiveTrialContent from './TabContents/ActiveTrialContent';
import LastAccessTrialContent from './TabContents/LastAccessTrialContent';
import ExpiredTrialContent from './TabContents/ExpiredTrialContent';
import ActiveContent from './TabContents/ActiveContent';
import LastAccessSubscriptionContent from './TabContents/LastAccessSubscriptionContent';
import ExpiredTenantContent from './TabContents/ExpiredTenantContent';

const TabSpecificContent = ({ tenant, activeTab, data, onAction }) => {
  const contentMap = {
    unverified: UnverifiedContent,
    active_trial: ActiveTrialContent,
    last_access_trial: LastAccessTrialContent,
    expired_trial: ExpiredTrialContent,
    active: ActiveContent,
    last_access_subscription: LastAccessSubscriptionContent,
    expired_tenant: ExpiredTenantContent
  };

  const ContentComponent = contentMap[activeTab];
  
  if (!ContentComponent) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">❓</div>
        <div>Unknown tab configuration</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <ContentComponent 
        tenant={tenant} 
        data={data} 
        onAction={onAction}
      />
    </div>
  );
};

export default TabSpecificContent;
