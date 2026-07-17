// Gera o hash bcrypt de uma senha para colar em ADMIN_PASSWORD_HASH no .env.
// Uso:  node crm-web/scripts/hash-senha.mjs "minhaSenhaForte"
import bcrypt from "bcryptjs";

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: node scripts/hash-senha.mjs "suaSenha"');
  process.exit(1);
}

const hash = await bcrypt.hash(senha, 10);
console.log(hash);
