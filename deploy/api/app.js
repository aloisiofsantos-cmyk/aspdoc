/**
 * AgilDoc - Entry point para cPanel / Phusion Passenger
 * Este arquivo é usado pelo Node.js Selector do cPanel.
 */
'use strict';

// Carrega variáveis de ambiente do arquivo .env na raiz do app
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importa o app compilado
const app = require('./dist/app').default;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AgilDoc API rodando na porta ${PORT}`);
});

module.exports = app;
