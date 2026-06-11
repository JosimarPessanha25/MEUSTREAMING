const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const adminEnvPath = path.join(__dirname, '../admin-panel/.env');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(adminEnvPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(adminEnvPath));
    supabaseUrl = envConfig.VITE_SUPABASE_URL;
    supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseAnonKey) {
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
    try {
        console.log('--- ATUALIZANDO REGISTROS DE LID PARA REAL JID NO SUPABASE ---');
        
        // 1. Apagar duplicados mantendo o mais recente (id: 7) para o lead de teste
        console.log('Deletando registros duplicados antigos...');
        const { error: deleteErr } = await supabase
            .from('leads')
            .delete()
            .in('id', [5, 6]);
            
        if (deleteErr) {
            console.error('Erro ao deletar duplicados:', deleteErr);
        } else {
            console.log('Registros 5 e 6 deletados.');
        }

        // 2. Atualizar o JID do id: 7 para o número real
        console.log('Atualizando JID do registro 7 para o número real...');
        const { error: updateErr } = await supabase
            .from('leads')
            .update({ phone_number: '5527995172109@c.us' })
            .eq('id', 7);
            
        if (updateErr) {
            console.error('Erro ao atualizar JID:', updateErr);
        } else {
            console.log('JID atualizado com sucesso para 5527995172109@c.us!');
        }
        
    } catch (err) {
        console.error('Erro inesperado:', err);
    }
}

cleanup();
