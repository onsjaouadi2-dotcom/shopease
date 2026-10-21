// Base de donnees en memoire pour la demo (v1.1 : requetes parametrees)
const users = [];

function query(sql, params, callback) {
  if (sql.startsWith("INSERT")) {
    const [name, email, password] = params;
    if (users.some((u) => u.email === email)) {
      const err = new Error("Duplicate entry");
      err.code = "ER_DUP_ENTRY";
      return callback(err);
    }
    users.push({ id: users.length + 1, name, email, password });
    return callback(null, { affectedRows: 1 });
  }
  if (sql.startsWith("UPDATE")) {
    const [password, email] = params;
    const u = users.find((x) => x.email === email);
    if (u) u.password = password;
    return callback(null, { affectedRows: u ? 1 : 0 });
  }
  if (sql.startsWith("SELECT")) {
    return callback(null, users.filter((u) => u.email === params[0]));
  }
  return callback(new Error("Requete non geree"));
}

module.exports = { query, users };
