const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// IMPORTANTE: Para o servidor (bot), o ideal é usar a SERVICE_ROLE_KEY
// Ela tem poderes de admin para ler/escrever no banco sem depender do RLS.
// NUNCA exponha essa chave no front-end, mas no Node.js (que roda no seu PC/servidor) é seguro usar via .env
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ ATENÇÃO: As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão definidas no arquivo .env.');
}

// Inicializa o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase
};
