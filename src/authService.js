// Service d'authentification de ShopEase
const db = require("./db");
const crypto = require("node:crypto");

const MAX_ATTEMPTS = 3;
const failedAttempts = {};

// Connexion d'un client
function login(email, password, callback) {
  const sql = "SELECT id, password FROM users WHERE email = ?";
  db.query(sql, [email], function (err, rows) {
    if (err) {
      return callback(err);
    }
    if ((failedAttempts[email] || 0) >= MAX_ATTEMPTS) {
      return callback(null, { locked: true });
    }
    if (rows.length === 0 || !verifyPassword(password, rows[0].password)) {
      failedAttempts[email] = (failedAttempts[email] || 0) + 1;
      return callback(null, { success: false, message: "E-mail ou mot de passe incorrect" });
    }
    failedAttempts[email] = 0;
    return callback(null, { success: true, token: generateToken() });
  });
}

// Jeton de session cryptographiquement sur
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Validation du mot de passe : 8 a 16 caracteres dont un chiffre
function isValidPassword(password) {
  return password.length >= 8 && password.length <= 16 && /\d/.test(password);
}

// Hachage robuste avec sel (scrypt)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

// Inscription d'un visiteur
function register(name, email, password, callback) {
  if (!isValidPassword(password)) {
    return callback(new Error("Le mot de passe doit contenir 8 a 16 caracteres"));
  }
  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashPassword(password)], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, { success: true });
  });
}

module.exports = { login, register, isValidPassword, generateToken, hashPassword };
