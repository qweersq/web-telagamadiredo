import React from 'react';

const SkeletonLoader = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header Skeleton */}
      <div className="bg-gray-50 px-4 md:px-6 py-4 border-b">
        <div className="hidden md:flex gap-2 text-sm font-medium text-gray-700">
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="w-28 flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="w-36 flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="w-32 flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="w-28 flex-shrink-0">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        
        {/* Mobile Header Skeleton */}
        <div className="md:hidden grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
          <div className="col-span-5">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="col-span-3">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="col-span-3">
            <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
          </div>
          <div className="col-span-1">
            <div className="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Table Body Skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-4 md:px-6 py-4">
            {/* Desktop View Skeleton */}
            <div className="hidden md:flex gap-2 items-center min-w-0">
              {/* Business */}
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              
              {/* Owner */}
              <div className="w-28 flex-shrink-0">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              
              {/* Contact */}
              <div className="w-36 flex-shrink-0">
                <div className="h-4 bg-gray-200 rounded w-28 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              
              {/* Registration */}
              <div className="w-32 flex-shrink-0">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              
              {/* Verification */}
              <div className="w-28 flex-shrink-0">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              </div>
              
              {/* Actions */}
              <div className="w-32 flex-shrink-0">
                <div className="flex space-x-1 justify-end">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Mobile View Skeleton */}
            <div className="md:hidden grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <div className="h-4 bg-gray-200 rounded w-28 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              
              <div className="col-span-3">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              </div>
              
              <div className="col-span-3">
                <div className="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
              </div>
              
              <div className="col-span-1">
                <div className="flex space-x-1">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
