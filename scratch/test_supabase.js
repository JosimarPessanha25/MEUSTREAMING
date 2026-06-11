const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Carrega as chaves do admin-panel/.env ou raiz
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
    console.log("Falha ao ler chaves do admin-panel/.env, usando raiz...");
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // usando service role key se falhar
}

console.log("Conectando ao Supabase URL:", supabaseUrl);
console.log("Usando Anon Key:", supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + "..." : "undefined");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        console.log("\n--- TESTANDO SELECT NA TABELA leads ---");
        const { data, error, status, statusText } = await supabase
            .from('leads')
            .select('*');
        
        if (error) {
            console.error("Erro no Select:", error);
        } else {
            console.log("Sucesso! Status:", status, statusText);
            console.log("Dados retornados:", data);
        }

        console.log("\n--- TESTANDO SELECT COM A SERVICE ROLE KEY ---");
        const serviceSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: serviceData, error: serviceError } = await serviceSupabase
            .from('leads')
            .select('*');
        
        if (serviceError) {
            console.error("Erro com Service Role Key:", serviceError);
        } else {
            console.log("Dados com Service Role Key:", serviceData);
        }
    } catch (e) {
        console.error("Exceção:", e);
    }
}

test();
