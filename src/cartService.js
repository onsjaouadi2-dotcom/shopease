// Calcul du panier ShopEase
const REMISES = { PROMO10: 0.1, PROMO20: 0.2, PROMO30: 0.3 };

function sousTotal(articles) {
  return articles.reduce((total, article) => total + article.prix * article.quantite, 0);
}

function appliquerRemises(total, codePromo, client) {
  let resultat = total * (1 - (REMISES[codePromo] || 0));
  if (resultat > 100) {
    resultat *= 0.95;
  }
  const clientFidele = client?.vip === true && client.anciennete > 2;
  if (clientFidele && resultat > 50) {
    resultat -= 5;
  }
  return resultat;
}

function calculerTotalPanier(articles, codePromo, client) {
  return appliquerRemises(sousTotal(articles), codePromo, client);
}

module.exports = { calculerTotalPanier };
