// Connexion a la base de donnees MySQL de ShopEase
const mysql = require("mysql");

// Les identifiants viennent des variables d'environnement, jamais du code
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Requete parametree : les valeurs sont echappees par le driver
function query(sql, params, callback) {
  connection.query(sql, params, callback);
}

module.exports = { query };
