/**
 * Helper functions for number input formatting
 */

/**
 * Format number input with thousand separators (Indonesian format)
 * @param {string} value - Input value
 * @returns {string} - Formatted number string with dots as thousand separators
 */
export const formatNumberInput = (value) => {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const numericValue = value.toString().replace(/\D/g, '');
  if (!numericValue) return '';
  
  // Convert to number and format with dots
  const number = parseInt(numericValue, 10);
  return number.toLocaleString('id-ID');
};

/**
 * Parse formatted number input back to numeric value
 * @param {string} formattedValue - Formatted number string
 * @returns {number} - Numeric value
 */
export const parseNumberInput = (formattedValue) => {
  if (!formattedValue) return 0;
  
  // Remove all non-numeric characters and convert to number
  const numericValue = formattedValue.toString().replace(/\D/g, '');
  return parseInt(numericValue, 10) || 0;
};

/**
 * Handle number input change with formatting
 * @param {Event} e - Input change event
 * @param {Function} setValue - State setter function
 * @param {Function} setDisplayValue - Display value setter function (optional)
 */
export const handleNumberInputChange = (e, setValue, setDisplayValue = null) => {
  const inputValue = e.target.value;
  const formattedValue = formatNumberInput(inputValue);
  const numericValue = parseNumberInput(formattedValue);
  
  // Update the actual numeric value
  setValue(numericValue);
  
  // Update display value if provided
  if (setDisplayValue) {
    setDisplayValue(formattedValue);
  }
};

/**
 * Format currency for display (without symbol)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrencyDisplay = (amount) => {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(amount);
};
