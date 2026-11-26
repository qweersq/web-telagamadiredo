import React from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaClock } from 'react-icons/fa';

const PaymentStatsCard = ({ title, value, icon, color, bgColor }) => {
  const getIcon = () => {
    switch (icon) {
      case 'money': return <FaMoneyBillWave className="text-lg font-semibold" />;
      case 'check': return <FaCheckCircle className="text-lg font-semibold" />;
      case 'clock': return <FaClock className="text-lg font-semibold" />;
      default: return <FaMoneyBillWave className="text-lg font-semibold" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-montserrat mb-1">{title}</p>
          <p className={`text-3xl font-bold font-montserrat ${color}`}>
            {value}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColor}`}>
          {getIcon()}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatsCard;
