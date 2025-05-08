require('dotenv').config();
const vault = require('node-vault')({ endpoint: process.env.VAULT_ADDR });

async function loadConfig() {
  const login = await vault.approleLogin({
    role_id: process.env.VAULT_ROLE_ID,
    secret_id: process.env.VAULT_SECRET_ID,
  });

  vault.token = login.auth.client_token;

  const secret = await vault.read('secret/data/app/config');
  return secret.data.data;
}

module.exports = loadConfig;