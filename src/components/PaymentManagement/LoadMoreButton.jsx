import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';

const LoadMoreButton = ({ hasNextPage, loadingMore, onLoadMore, currentCount, totalCount }) => {
  if (!hasNextPage) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center">
        <AnimatedButton
          onClick={onLoadMore}
          disabled={loadingMore}
          className={`px-8 py-4 rounded-xl font-montserrat text-lg shadow-lg ${
            loadingMore
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
          }`}
        >
          {loadingMore ? (
            <div className="flex items-center gap-3">
              <FaSpinner className="animate-spin" />
              Loading...
            </div>
          ) : (
            'Load More Payments'
          )}
        </AnimatedButton>
        <p className="text-sm text-gray-600 font-montserrat mt-3">
          Showing {currentCount} of {totalCount} payments
        </p>
      </div>
    </div>
  );
};

export default LoadMoreButton;
