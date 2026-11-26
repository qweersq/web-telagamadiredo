import { motion } from "framer-motion";
import buttonStyles from "./ButtonDesign";

const AnimatedButton = ({
  children,
  variant,
  className,
  onClick,
  disabled,
  type = "button",
  ...props
}) => {
  const buttonClass = buttonStyles[variant] || buttonStyles.default;

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      // whileHover={{ scale: disabled ? 1 : 1.05 }}
      transition={{ duration: 0.2 }}
      className={`${buttonClass} ${className} relative`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
