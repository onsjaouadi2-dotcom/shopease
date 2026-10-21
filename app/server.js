// Mini-application web ShopEase pour les tests manuels (aucune dependance externe)
// Lancement : node app/server.js   (VERSION=1.0 pour la version avec defauts)
const http = require("node:http");
const crypto = require("node:crypto");

const VERSION = process.env.VERSION === "1.0" ? "1.0" : "1.1";
const PORT = Number(process.env.PORT) || 3000;
const RESET_TTL = (Number(process.env.RESET_TTL_SECONDS) || 1800) * 1000;

const auth = VERSION === "1.0" ? require("./legacy/authService") : require("../src/authService");
const store = VERSION === "1.0" ? require("./legacy/db") : require("./memoryDb");

// Precondition SHOP-27 : un compte client actif existe
const seedPassword = VERSION === "1.0" ? "Test1234" : auth.hashPassword("Test1234");
store.users.push({ name: "Client Test", email: "client.test@shopease.tn", password: seedPassword });

const sessions = new Map();
const resetTokens = new Map();

function page(title, body, status = 200) {
  const color = VERSION === "1.0" ? "#C0392B" : "#2F855A";
  return { status, html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title} - ShopEase</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Segoe UI,Arial,sans-serif;background:#F4F6FA;color:#1B2333;margin:0}
header{background:#14213D;color:#fff;padding:14px 24px;display:flex;justify-content:space-between;align-items:center}
header a{color:#fff;margin-left:16px;text-decoration:none}
.v{background:${color};padding:2px 10px;border-radius:10px;font-size:13px;margin-left:10px}
main{max-width:440px;margin:40px auto;background:#fff;padding:28px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
h1{font-size:22px;margin:0 0 18px}
label{display:block;margin:12px 0 4px;font-size:14px}
input{width:100%;padding:10px;border:1px solid #C9D1DE;border-radius:6px;box-sizing:border-box;font-size:15px}
button{margin-top:18px;width:100%;padding:11px;background:#1F4E9E;color:#fff;border:0;border-radius:6px;font-size:15px;cursor:pointer}
.msg{padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:14px}
.err{background:#FDECEA;color:#9B2C2C}.ok{background:#E6F4EA;color:#22543D}.info{background:#EAF0FA;color:#1F4E9E}
p.small{font-size:13px;color:#5A6478}
</style></head><body>
<header><b>ShopEase<span class="v">v${VERSION}</span></b><nav><a href="/register">Inscription</a><a href="/login">Connexion</a><a href="/compte">Mon compte</a></nav></header>
<main>${body}</main></body></html>` };
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const msg = (type, text) => (text ? `<div class="msg ${type}" id="message">${esc(text)}</div>` : "");

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(Object.fromEntries(new URLSearchParams(data))));
  });
}

function sessionEmail(req) {
  const m = (req.headers.cookie || "").match(/sid=([a-f0-9]+)/);
  return m ? sessions.get(m[1]) : undefined;
}

const views = {
  register: (m = "") => page("Inscription", `<h1>Créer un compte</h1>${m}
<form method="post" action="/register">
<label for="name">Nom</label><input id="name" name="name" required>
<label for="email">E-mail</label><input id="email" name="email" type="email" required>
<label for="password">Mot de passe (8 à 16 caractères, dont un chiffre)</label><input id="password" name="password" type="password" required>
<button type="submit">S'inscrire</button></form>`),
  login: (m = "") => page("Connexion", `<h1>Connexion</h1>${m}
<form method="post" action="/login">
<label for="email">E-mail</label><input id="email" name="email" type="email" required>
<label for="password">Mot de passe</label><input id="password" name="password" type="password" required>
<button type="submit">Se connecter</button></form>
<p class="small"><a href="/mot-de-passe-oublie">Mot de passe oublié ?</a></p>`),
  forgot: (m = "") => page("Mot de passe oublié", `<h1>Mot de passe oublié</h1>${m}
<form method="post" action="/mot-de-passe-oublie">
<label for="email">E-mail</label><input id="email" name="email" type="email" required>
<button type="submit">Recevoir le lien</button></form>`),
  reset: (token, m = "") => page("Nouveau mot de passe", `<h1>Nouveau mot de passe</h1>${m}
<form method="post" action="/reinitialiser">
<input type="hidden" name="token" value="${esc(token)}">
<label for="password">Nouveau mot de passe</label><input id="password" name="password" type="password" required>
<button type="submit">Enregistrer</button></form>`)
};

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const send = ({ status, html }, headers = {}) => {
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers });
    res.end(html);
  };
  const redirect = (to, headers = {}) => {
    res.writeHead(302, { Location: to, "Cache-Control": "no-store", ...headers });
    res.end();
  };

  if (url.pathname === "/") return redirect("/login");

  if (url.pathname === "/register") {
    if (req.method === "GET") return send(views.register());
    const { name, email, password } = await readBody(req);
    return auth.register(name, email, password, (err) => {
      if (err && err.code === "ER_DUP_ENTRY") return send(views.register(msg("err", "Cet e-mail est déjà utilisé.")));
      if (err) return send(views.register(msg("err", err.message)));
      console.log(`[e-mail simulé] Bienvenue ${name} <${email}>`);
      return send(views.register(msg("ok", "Compte créé. Un e-mail de bienvenue a été envoyé.")));
    });
  }

  if (url.pathname === "/login") {
    if (req.method === "GET") return send(views.login());
    const { email, password } = await readBody(req);
    return auth.login(email, password, (err, result) => {
      if (err) return send(views.login(msg("err", "Erreur serveur.")));
      if (result.locked) return send(views.login(msg("err", "Compte verrouillé pendant 15 minutes.")));
      if (!result.success) return send(views.login(msg("err", result.message)));
      const sid = crypto.randomBytes(16).toString("hex");
      sessions.set(sid, email);
      return redirect("/compte", { "Set-Cookie": `sid=${sid}; HttpOnly; Path=/; SameSite=Lax` });
    });
  }

  if (url.pathname === "/compte") {
    const email = sessionEmail(req);
    if (!email) return redirect("/login");
    return send(page("Mon compte", `<h1>Bienvenue dans votre espace client</h1>
<p>Connecté en tant que <b>${esc(email)}</b>.</p>
<form method="post" action="/logout"><button type="submit">Se déconnecter</button></form>`));
  }

  if (url.pathname === "/logout") {
    const m = (req.headers.cookie || "").match(/sid=([a-f0-9]+)/);
    if (m) sessions.delete(m[1]);
    return redirect("/login", { "Set-Cookie": "sid=; Max-Age=0; Path=/" });
  }

  if (url.pathname === "/mot-de-passe-oublie") {
    if (req.method === "GET") return send(views.forgot());
    const { email } = await readBody(req);
    const token = crypto.randomBytes(16).toString("hex");
    resetTokens.set(token, { email, expires: Date.now() + RESET_TTL });
    const link = `/reinitialiser?token=${token}`;
    console.log(`[e-mail simulé] Lien de réinitialisation pour ${email} : http://localhost:${PORT}${link}`);
    return send(views.forgot(msg("info", "Si un compte existe, un lien a été envoyé.") +
      `<div class="msg info"><b>E-mail simulé</b> (pas de serveur SMTP en démo) :<br><a id="lien" href="${link}">Réinitialiser mon mot de passe</a><br>Lien valable ${Math.round(RESET_TTL / 60000) || RESET_TTL / 1000 + " s"} ${RESET_TTL >= 60000 ? "minutes" : ""}.</div>`));
  }

  if (url.pathname === "/reinitialiser") {
    const params = req.method === "GET" ? Object.fromEntries(url.searchParams) : await readBody(req);
    const entry = resetTokens.get(params.token);
    if (!entry || entry.expires < Date.now()) return send(views.forgot(msg("err", "Ce lien a expiré. Demandez un nouveau lien.")));
    if (req.method === "GET") return send(views.reset(params.token));
    if (!auth.isValidPassword(params.password)) return send(views.reset(params.token, msg("err", "Le mot de passe doit contenir 8 à 16 caractères, dont un chiffre.")));
    resetTokens.delete(params.token);
    const done = () => send(views.login(msg("ok", "Mot de passe modifié. Vous pouvez vous connecter.")));
    if (VERSION === "1.0") {
      const hash = crypto.createHash("md5").update(params.password).digest("hex");
      return store.query(`UPDATE users SET password = '${hash}' WHERE email = '${entry.email}'`, done);
    }
    return store.query("UPDATE users SET password = ? WHERE email = ?", [auth.hashPassword(params.password), entry.email], done);
  }

  return send(page("Introuvable", "<h1>Page introuvable</h1>", 404));
}

http.createServer((req, res) => handle(req, res).catch(() => { res.writeHead(500); res.end("Erreur"); }))
  .listen(PORT, () => console.log(`ShopEase v${VERSION} : http://localhost:${PORT}  (compte de test : client.test@shopease.tn / Test1234)`));
