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

async function isRegisteredLead(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace('@c.us', '').replace('@lid', '').replace(/\D/g, '');
    try {
        const { data } = await supabase
            .from('leads')
            .select('id')
            .or(`phone_number.eq.${cleanPhone}@c.us,phone_number.eq.${cleanPhone}@lid,phone_number.like.%${cleanPhone}%`)
            .limit(1);
        return data && data.length > 0;
    } catch (err) {
        console.error('[isRegisteredLead] Erro ao verificar no Supabase:', err.message || err);
        return false;
    }
}

module.exports = {
    supabase,
    isRegisteredLead
};
