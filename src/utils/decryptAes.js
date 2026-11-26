import CryptoJS from 'crypto-js';

const decryptAes = (encrypted, key) => {
  // Pisahkan IV dan ciphertext
  const [ivHex, cipherHex] = encrypted.split(':');
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const cipherParams = CryptoJS.enc.Hex.parse(cipherHex);

  // Buat CipherParams object agar bisa didecrypt
  const cipherParamsObj = CryptoJS.lib.CipherParams.create({
    ciphertext: cipherParams
  });

  // Dekripsi
  const decrypted = CryptoJS.AES.decrypt(cipherParamsObj, keyUtf8, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};

export default decryptAes;
