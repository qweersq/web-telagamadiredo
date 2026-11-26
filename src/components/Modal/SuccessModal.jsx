import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const SuccessModal = ({ isOpen, onClose, title = "Berhasil!", message, onConfirm, confirmText = "OK", showCloseButton = false, onSecondary, secondaryText, variant = "single" }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={showCloseButton ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
            className="flex justify-center mb-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-montserrat font-bold text-gray-800 text-center mb-2 "
          >
            {title}
          </motion.h3>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-center mb-6 leading-relaxed font-montserrat text-sm"
          >
            {message}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-3"
          >
            {variant === "double" && onSecondary && secondaryText ? (
              <>
                <AnimatedButton
                  variant="grey"
                  onClick={onSecondary}
                  className="px-6 py-3 font-montserrat font-semibold text-sm"
                >
                  {secondaryText}
                </AnimatedButton>
                <AnimatedButton
                  variant="blue"
                  onClick={onConfirm}
                  className="px-6 py-3 font-montserrat font-semibold text-sm"
                >
                  {confirmText}
                </AnimatedButton>
              </>
            ) : (
              <AnimatedButton
                variant="blue"
                onClick={onConfirm}
                className="px-8 py-3 font-montserrat font-semibold text-sm"
              >
                {confirmText}
              </AnimatedButton>
            )}
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full opacity-20"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-300 rounded-full opacity-20"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessModal; 