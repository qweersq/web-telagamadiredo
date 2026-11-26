import { Minus, Plus } from 'lucide-react';

/**
 * QuantityInput - Reusable quantity input component with + and - buttons
 * 
 * @component
 * @example
 * // Basic usage
 * <QuantityInput
 *   value={quantity}
 *   onChange={setQuantity}
 *   label="Qty Item"
 * />
 * 
 * @example
 * // With custom size and constraints
 * <QuantityInput
 *   value={quantity}
 *   onChange={setQuantity}
 *   label="Quantity"
 *   size="large"
 *   min={1}
 *   max={100}
 *   disabled={isLoading}
 * />
 * 
 * @example
 * // Without label (for inline usage)
 * <QuantityInput
 *   value={quantity}
 *   onChange={setQuantity}
 *   showLabel={false}
 *   size="small"
 * />
 * 
 * @param {Object} props
 * @param {number} props.value - Current quantity value
 * @param {function} props.onChange - Callback when value changes
 * @param {number} [props.min=0] - Minimum allowed value
 * @param {number} [props.max=999] - Maximum allowed value
 * @param {string} [props.label="Qty Item"] - Label text
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.showLabel=true] - Whether to show label
 * @param {string} [props.size="default"] - Size variant: "small", "default", "large"
 */
const QuantityInput = ({
  value = 0,
  onChange,
  min = 0,
  max = 999,
  label = "Qty Item",
  className = "",
  disabled = false,
  showLabel = true,
  size = "default", // "small", "default", "large"
  unitLabel = null // opsional, mis. "porsi" — default tampil "item"
}) => {
  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(Math.max(min, Number(value) + 1));
    }
  };

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(Math.max(min, Number(value) - 1));
    }
  };

  const handleInputChange = (e) => {
    if (!disabled) {
      const newValue = Math.max(min, Math.min(max, Number(e.target.value) || 0));
      onChange(newValue);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: "h-10",
      button: "p-2",
      input: "text-sm",
      icon: "w-3 h-3",
      label: "text-xs"
    },
    default: {
      container: "h-14",
      button: "p-3",
      input: "text-lg",
      icon: "w-4 h-4",
      label: "text-xs"
    },
    large: {
      container: "h-16",
      button: "p-4",
      input: "text-xl",
      icon: "w-5 h-5",
      label: "text-sm"
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col ${className}`}>
      {showLabel && (
        <label className={`block font-semibold text-gray-600 mb-1 font-montserrat ${config.label}`}>
          {label}
        </label>
      )}
      <div className={`flex items-center border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 ${config.container} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`hover:bg-red-50 hover:text-red-600 rounded-l-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.button}`}
          type="button"
        >
          <Minus className={config.icon} />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={handleInputChange}
          disabled={disabled}
          className={`w-full text-center border-none outline-none bg-transparent font-semibold text-gray-700 font-montserrat ${config.input}`}
          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
        />
        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`hover:bg-green-50 hover:text-green-600 rounded-r-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.button}`}
          type="button"
        >
          <Plus className={config.icon} />
        </button>
      </div>
      {/* Quantity indicator */}
      {value > 0 && (
        <div className={`mt-1 text-gray-500 text-center font-montserrat ${config.label}`}>
          {unitLabel ? `${value} ${unitLabel}` : `${value} item`}
        </div>
      )}
    </div>
  );
};

export default QuantityInput; 