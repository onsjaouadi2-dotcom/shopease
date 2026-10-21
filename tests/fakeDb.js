// Fausse base de donnees en memoire (remplace MySQL pendant les tests)
const users = [];

function query(sql, params, callback) {
  if (sql.startsWith("INSERT")) {
    const [name, email, password] = params;
    if (users.some((u) => u.email === email)) {
      const err = new Error("Duplicate entry for key 'email'");
      err.code = "ER_DUP_ENTRY";
      return callback(err);
    }
    users.push({ id: users.length + 1, name, email, password });
    return callback(null, { affectedRows: 1 });
  }
  if (sql.startsWith("SELECT")) {
    const [email] = params;
    return callback(null, users.filter((u) => u.email === email));
  }
  return callback(new Error("Requete non geree : " + sql));
}

function reset() {
  users.length = 0;
}

module.exports = { query, reset };
