// Base en memoire pour la v1.0 : requetes construites par concatenation (comme le code d'origine)
const users = [];

function query(sql, callback) {
  let m = sql.match(/INSERT INTO users \(name, email, password\) VALUES \('(.*?)', '(.*?)', '(.*?)'\)/);
  if (m) {
    if (users.some((u) => u.email === m[2])) {
      const err = new Error("Duplicate entry");
      err.code = "ER_DUP_ENTRY";
      return callback(err);
    }
    users.push({ name: m[1], email: m[2], password: m[3] });
    return callback(null, {});
  }
  m = sql.match(/UPDATE users SET password = '(.*?)' WHERE email = '(.*?)'/);
  if (m) {
    const u = users.find((x) => x.email === m[2]);
    if (u) u.password = m[1];
    return callback(null, {});
  }
  m = sql.match(/email = '(.*?)' AND password = '(.*?)'/);
  if (m) return callback(null, users.filter((u) => u.email === m[1] && u.password === m[2]));
  m = sql.match(/email = '(.*?)'/);
  if (m) return callback(null, users.filter((u) => u.email === m[1]));
  return callback(null, []);
}

module.exports = { query, users };
