// Tests automatises du module d'authentification (cles Xray entre crochets)
let auth;
const register = (...args) => new Promise((resolve) => auth.register(...args, (err, res) => resolve({ err, res })));
const login = (...args) => new Promise((resolve) => auth.login(...args, (err, res) => resolve({ err, res })));

beforeEach(() => {
  jest.resetModules();
  jest.mock("../src/db", () => require("./fakeDb"));
  auth = require("../src/authService");
  require("../src/db").reset();
});

describe("Inscription", () => {
  test("[SHOP-30] Inscription avec donnees valides", async () => {
    const { err, res } = await register("Test", "test.new@shopease.tn", "Shop2026");
    expect(err).toBeNull();
    expect(res.success).toBe(true);
  });

  test("[SHOP-31] Mot de passe de 7 caracteres refuse", async () => {
    const { err } = await register("Test", "a@shopease.tn", "Shop202");
    expect(err.message).toMatch(/8 a 16 caracteres/);
  });

  test("[SHOP-32] Mot de passe de 16 caracteres accepte", async () => {
    const { err, res } = await register("Test", "b@shopease.tn", "ShopEase20262027");
    expect(err).toBeNull();
    expect(res.success).toBe(true);
  });

  test("[SHOP-33] Mot de passe de 17 caracteres refuse", async () => {
    const { err } = await register("Test", "c@shopease.tn", "ShopEase202620271");
    expect(err.message).toMatch(/8 a 16 caracteres/);
  });

  test("[SHOP-34] Inscription avec un e-mail deja utilise", async () => {
    await register("Client", "client.test@shopease.tn", "Test1234");
    const { err } = await register("Autre", "client.test@shopease.tn", "Autre1234");
    expect(err.code).toBe("ER_DUP_ENTRY");
  });

  test("Le mot de passe est stocke hache, jamais en clair", async () => {
    await register("Client", "client.test@shopease.tn", "Test1234");
    require("../src/db").query("SELECT", ["client.test@shopease.tn"], (e, rows) => {
      expect(rows[0].password).not.toContain("Test1234");
      expect(rows[0].password).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    });
  });
});

describe("Connexion", () => {
  beforeEach(async () => {
    await register("Client", "client.test@shopease.tn", "Test1234");
  });

  test("[SHOP-35] Connexion avec identifiants valides", async () => {
    const { res } = await login("client.test@shopease.tn", "Test1234");
    expect(res.success).toBe(true);
    expect(res.token).toMatch(/^[0-9a-f]{64}$/);
  });

  test("[SHOP-36] Connexion avec mot de passe incorrect", async () => {
    const { res } = await login("client.test@shopease.tn", "Faux1234");
    expect(res.success).toBe(false);
    expect(res.message).toBe("E-mail ou mot de passe incorrect");
  });

  test("[SHOP-37] Verrouillage apres 3 echecs consecutifs", async () => {
    await login("client.test@shopease.tn", "Faux1234");
    await login("client.test@shopease.tn", "Faux1234");
    await login("client.test@shopease.tn", "Faux1234");
    const { res } = await login("client.test@shopease.tn", "Test1234");
    expect(res.locked).toBe(true);
    expect(res.success).toBeUndefined();
  });

  test("E-mail inconnu : message generique", async () => {
    const { res } = await login("inconnu@shopease.tn", "Test1234");
    expect(res.success).toBe(false);
  });

  test("Deux jetons de session sont differents", () => {
    expect(auth.generateToken()).not.toBe(auth.generateToken());
  });
});
