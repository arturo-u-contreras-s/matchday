const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET
const iv = crypto.randomBytes(16);

const encryptToken = (token) => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

const decryptToken = (encryptedToken) => {
  const [ivHex, encryptedData] = encryptedToken.split(":");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), Buffer.from(ivHex, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encryptToken, decryptToken };