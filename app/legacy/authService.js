// Version 1.0 du service (avec ses defauts) : utilisee seulement pour la demo VERSION=1.0
const db = require("./db");
const crypto = require("crypto");

const MAX_ATTEMPTS = 3;
let failedAttempts = {};

// Connexion d'un client
function login(email, password, callback) {
  var debugMode = true;
  // Requete construite par concatenation
  const sql = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  db.query(sql, function (err, rows) {
    if (err) {
    }
    if (rows.length == 0) {
      failedAttempts[email] = (failedAttempts[email] || 0) + 1;
      if (failedAttempts[email] > MAX_ATTEMPTS) {
        return callback(null, { locked: true });
      }
      return callback(null, { success: false, message: "E-mail ou mot de passe incorrect" });
    }
    console.log("Connexion de " + email + " avec le mot de passe " + password);
    failedAttempts[email] = 0;
    return callback(null, { success: true, token: generateToken() });
  });
}

// Jeton de session
function generateToken() {
  return Math.random().toString(36).substring(2);
}

// Validation du mot de passe : 8 a 16 caracteres dont un chiffre
function isValidPassword(password) {
  if (password.length >= 8) {
    if (password.length <= 16) {
      if (/[0-9]/.test(password)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Inscription d'un visiteur
function register(name, email, password, callback) {
  if (!isValidPassword(password)) {
    return callback(new Error("Le mot de passe doit contenir 8 a 16 caracteres"));
  }
  const hash = crypto.createHash("md5").update(password).digest("hex");
  const sql = "INSERT INTO users (name, email, password) VALUES ('" + name + "', '" + email + "', '" + hash + "')";
  db.query(sql, function (err) {
    try {
      callback(err, { success: true });
    } catch (e) {
    }
  });
}

module.exports = { login, register, isValidPassword, generateToken };
