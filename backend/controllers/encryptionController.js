const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const env = require('dotenv').config();

key = process.env.NEXTCLOUD_ENCRYPTION_KEY;

const encrypt = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  
  try {
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    return result;
  }catch(err){
    console.log(err);
    return -1;
  }
}

const decrypt = (encrypted) => {
  const iv = encrypted.slice(0, 16);
  const data = encrypted.slice(16);
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  
  try {
    const result = Buffer.concat([decipher.update(data), decipher.final()]);

    return result;
  }catch(err){
    console.log(err);
    return -1;
  }
}