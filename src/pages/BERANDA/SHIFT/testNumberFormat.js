/**
 * Test script untuk memverifikasi formatNumber dan parseNumber functions
 */

// Simulasi functions dari OpenShiftModal.jsx
const formatNumber = (value) => {
  // Hapus semua karakter non-digit
  const numericValue = value.replace(/\D/g, '');
  // Format dengan pemisah titik setiap 3 digit
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumber = (formattedValue) => {
  // Hapus pemisah titik dan return sebagai number
  return parseInt(formattedValue.replace(/\./g, '')) || 0;
};

console.log('🧪 TESTING NUMBER FORMAT FUNCTIONS');
console.log('==================================');

// Test cases
const testCases = [
  { input: '1000000', expected: '1.000.000', description: '1 juta' },
  { input: '50000', expected: '50.000', description: '50 ribu' },
  { input: '1000', expected: '1.000', description: '1 ribu' },
  { input: '100', expected: '100', description: '100' },
  { input: '1234567', expected: '1.234.567', description: '1.234.567' },
  { input: '1000000000', expected: '1.000.000.000', description: '1 milyar' },
  { input: '0', expected: '0', description: 'Nol' },
  { input: '', expected: '', description: 'Kosong' },
  { input: 'abc123def', expected: '123', description: 'Dengan huruf' },
  { input: '1.000.000', expected: '1.000.000', description: 'Sudah diformat' },
  { input: '1,000,000', expected: '1.000.000', description: 'Dengan koma' }
];

console.log('\n📊 FORMAT NUMBER TESTS:');
console.log('=======================');

testCases.forEach((testCase, index) => {
  const result = formatNumber(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   Expected: "${testCase.expected}"`);
  console.log(`   Result: "${result}"`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log(`   ❌ Expected "${testCase.expected}" but got "${result}"`);
  }
});

console.log('\n📊 PARSE NUMBER TESTS:');
console.log('======================');

const parseTestCases = [
  { input: '1.000.000', expected: 1000000, description: '1 juta' },
  { input: '50.000', expected: 50000, description: '50 ribu' },
  { input: '1.000', expected: 1000, description: '1 ribu' },
  { input: '100', expected: 100, description: '100' },
  { input: '1.234.567', expected: 1234567, description: '1.234.567' },
  { input: '1.000.000.000', expected: 1000000000, description: '1 milyar' },
  { input: '0', expected: 0, description: 'Nol' },
  { input: '', expected: 0, description: 'Kosong' },
  { input: 'abc', expected: 0, description: 'Hanya huruf' }
];

parseTestCases.forEach((testCase, index) => {
  const result = parseNumber(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Result: ${result}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log(`   ❌ Expected ${testCase.expected} but got ${result}`);
  }
});

console.log('\n🔄 ROUND-TRIP TESTS:');
console.log('===================');

const roundTripTests = [
  { value: 1000000, description: '1 juta' },
  { value: 50000, description: '50 ribu' },
  { value: 1000, description: '1 ribu' },
  { value: 100, description: '100' },
  { value: 1234567, description: '1.234.567' },
  { value: 0, description: 'Nol' }
];

roundTripTests.forEach((testCase, index) => {
  const formatted = formatNumber(testCase.value.toString());
  const parsed = parseNumber(formatted);
  const passed = parsed === testCase.value;
  
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Original: ${testCase.value}`);
  console.log(`   Formatted: "${formatted}"`);
  console.log(`   Parsed: ${parsed}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passed) {
    console.log(`   ❌ Expected ${testCase.value} but got ${parsed}`);
  }
});

console.log('\n🎯 USAGE EXAMPLES:');
console.log('==================');

console.log('\n1. User types "1000000":');
console.log(`   formatNumber("1000000") = "${formatNumber('1000000')}"`);
console.log(`   parseNumber("${formatNumber('1000000')}") = ${parseNumber(formatNumber('1000000'))}`);

console.log('\n2. User types "50.000":');
console.log(`   formatNumber("50.000") = "${formatNumber('50.000')}"`);
console.log(`   parseNumber("${formatNumber('50.000')}") = ${parseNumber(formatNumber('50.000'))}`);

console.log('\n3. User types "abc123def":');
console.log(`   formatNumber("abc123def") = "${formatNumber('abc123def')}"`);
console.log(`   parseNumber("${formatNumber('abc123def')}") = ${parseNumber(formatNumber('abc123def'))}`);

console.log('\n✅ ALL TESTS COMPLETED');
console.log('\n💡 FEATURES:');
console.log('- ✅ Auto-format dengan pemisah titik setiap 3 digit');
console.log('- ✅ Hanya menerima input angka');
console.log('- ✅ Menghapus karakter non-digit');
console.log('- ✅ Round-trip conversion (format -> parse -> same value)');
console.log('- ✅ Handle edge cases (empty, zero, letters)');
