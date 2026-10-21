const { calculerTotalPanier } = require("../src/cartService");

const panier = [
  { prix: 40, quantite: 1 },
  { prix: 20, quantite: 2 }
]; // 80 DT

describe("Calcul du panier", () => {
  test("Sans code promo ni remise", () => {
    expect(calculerTotalPanier(panier)).toBe(80);
  });
  test("Code PROMO10 : -10 %", () => {
    expect(calculerTotalPanier(panier, "PROMO10")).toBeCloseTo(72);
  });
  test("Code inconnu : aucune remise", () => {
    expect(calculerTotalPanier(panier, "FAUX")).toBe(80);
  });
  test("Remise automatique de 5 % au-dela de 100 DT", () => {
    expect(calculerTotalPanier([{ prix: 200, quantite: 1 }])).toBeCloseTo(190);
  });
  test("Client VIP fidele : -5 DT au-dela de 50 DT", () => {
    expect(calculerTotalPanier(panier, null, { vip: true, anciennete: 3 })).toBe(75);
  });
  test("Client VIP recent : pas de remise fidelite", () => {
    expect(calculerTotalPanier(panier, null, { vip: true, anciennete: 1 })).toBe(80);
  });
});
