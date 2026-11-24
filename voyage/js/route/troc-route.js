// Le troc du marché de la cité (pur, sans Three.js) : on échange des marchandises, jamais de l'argent. Trois marchands fictifs, trois échanges équitables en chaîne :
// 2 dattes → 1 tissu (tisserande), 1 tissu → 1 jarre (potier), 1 jarre → 4 dattes (marchand). Chacun y gagne ; on repart avec plus de dattes qu'au départ.
// Rien ici ne touche aux pièces du jeu, à la boutique, aux achats ni à Stripe : le panier est un simple petit stock dans etat.route.troc.
export const OBJETS = { datte: { icone: '🌴', nom: 'dattes' }, tissu: { icone: '🧵', nom: 'tissu' }, jarre: { icone: '🏺', nom: 'jarre' } };
export const CADEAU = { item: 'datte', n: 4 };      // le marchand de dattes offre de quoi commencer (et recommencer si l'enfant est bloqué)

// donne : ce que l'enfant reçoit ; veut : ce que le marchand demande en échange
export const TROCS = {
  tisserande: { voix: 'perso-warda', donne: { item: 'tissu', n: 1 }, veut: { item: 'datte', n: 2 },
    offre: { petit: `Je donne un tissu contre deux dattes. D'accord ?`, grand: `Mes tissus sont chauds et solides. Je te donne un tissu contre deux dattes. D'accord ?` },
    ok: { petit: `Merci ! Voici ton beau tissu.`, grand: `Merci ! Voici ton tissu. Chacun y gagne : toi un tissu, moi de quoi manger.` },
    manque: { petit: `Il te faut deux dattes pour cet échange.`, grand: `Il te faut deux dattes pour cet échange. Le marchand de dattes pourra t'aider.` } },
  potier: { voix: 'perso-yacine', donne: { item: 'jarre', n: 1 }, veut: { item: 'tissu', n: 1 },
    offre: { petit: `Je donne une jarre contre un tissu. D'accord ?`, grand: `Je fabrique des jarres, mais il me manque un tissu pour me protéger du soleil. Je te donne une jarre contre un tissu. D'accord ?` },
    ok: { petit: `Merci ! Voici ta jarre.`, grand: `Merci ! Voici une jarre. Chacun y gagne : toi une jarre, moi un tissu pour me protéger du soleil.` },
    manque: { petit: `Il te faut un tissu pour cet échange.`, grand: `Il te faut un tissu pour cet échange. La tisserande en a : elle aime les dattes.` } },
  'marchand-dattes': { voix: 'perso-karim', donne: { item: 'datte', n: 4 }, veut: { item: 'jarre', n: 1 },
    cadeau: { petit: `Pour commencer, voici quatre dattes pour toi !`, grand: `Pour commencer, voici quatre dattes de mon étal : on n'échange bien que si l'on a quelque chose à offrir.` },
    offre: { petit: `Je donne quatre dattes contre une jarre. D'accord ?`, grand: `J'ai besoin de jarres pour ranger mes dattes. Je te donne quatre dattes contre une jarre. D'accord ?` },
    ok: { petit: `Merci ! Tu as quatre dattes de plus.`, grand: `Merci ! Voilà quatre dattes. Chacun y gagne : toi des dattes, moi une jarre pour les ranger.` },
    manque: { petit: `Il te faut une jarre pour cet échange.`, grand: `Il te faut une jarre pour cet échange. Le potier en fabrique : va le voir avec un tissu.` } }
};

export const stockVide = () => ({ datte: 0, tissu: 0, jarre: 0 });
export const peutEchanger = (stock, id) => (stock[TROCS[id].veut.item] || 0) >= TROCS[id].veut.n;
// un échange : renvoie { ok, stock } (le stock d'origine n'est jamais modifié ; s'il manque quelque chose, rien ne change)
export function echanger(stock, id) {
  const t = TROCS[id], s = { ...stockVide(), ...stock };
  if (!peutEchanger(s, id)) return { ok: false, stock: s };
  s[t.veut.item] -= t.veut.n; s[t.donne.item] += t.donne.n; return { ok: true, stock: s };
}
// l'enfant ne peut plus rien échanger avec personne : le marchand lui redonne de quoi recommencer (on n'est jamais bloqué)
export const bloque = stock => !Object.keys(TROCS).some(id => peutEchanger(stock, id));
export const panierTexte = stock => { const l = Object.entries(OBJETS).filter(([k]) => (stock[k] || 0) > 0).map(([k, o]) => `${o.icone} ${stock[k]}`); return l.length ? 'Ton panier : ' + l.join('  ') : 'Ton panier est vide.'; };
