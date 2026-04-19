const Database = require('better-sqlite3');
const db = new Database('./nexaflow.db');

const c = db.prepare('SELECT COUNT(*) as c FROM employes').get();
console.log('COUNT:', c.c);

console.log('\nSAMPLE (Engineering):');
const rows = db.prepare("SELECT nom, salaire FROM employes WHERE departement='Engineering' LIMIT 5").all();
rows.forEach(r => console.log(r.nom + ' — ' + r.salaire));
