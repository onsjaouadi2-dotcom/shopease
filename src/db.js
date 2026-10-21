// Connexion a la base de donnees de ShopEase
// Sans DB_HOST (demo locale), une base en memoire remplace MySQL.
if (!process.env.DB_HOST) {
  module.exports = require("../app/memoryDb");
} else {
  const mysql = require("mysql");
  // Les identifiants viennent des variables d'environnement, jamais du code
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  // Requete parametree : les valeurs sont echappees par le driver
  module.exports = {
    query(sql, params, callback) {
      connection.query(sql, params, callback);
    }
  };
}
