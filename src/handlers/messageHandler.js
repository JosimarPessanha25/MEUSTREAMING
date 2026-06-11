const { handleSalesFlow } = require('../flows/sales');
const { handleContentRequest } = require('../flows/content');
const { handleSupportFlow } = require('../flows/support');
const { isRegisteredLead } = require('../db/supabase');

/**
 * Roteia a mensagem recebida para o fluxo correto com base no gatilho.
 * @param {import('whatsapp-web.js').Client} client 
 * @param {import('whatsapp-web.js').Message} msg 
 */
async function handleMessage(client, msg) {
    const text = msg.body || '';
    
    console.log(`Mensagem recebida de ${msg.from}: ${text}`);

    // Fluxo 1: Vendas (Assinatura e Teste)
    if (text && text.includes("Tenho interesse em assinar e acabei de preencher a triagem no site")) {
        console.log("➡️ Roteando para fluxo de VENDAS");
        await handleSalesFlow(msg);
        return;
    }

    // Fluxo 2 e 3: Solicitações pelo site
    if (text.includes("Tenho uma solicitação enviada pelo site")) {
        
        if (text.includes("*Tipo:* Solicitação de Conteúdo")) {
            console.log("➡️ Roteando para fluxo de SOLICITAÇÃO DE CONTEÚDO");
            await handleContentRequest(msg);
            return;
        }

        if (text.includes("*Tipo:* Reportar Bug")) {
            console.log("➡️ Roteando para fluxo de SUPORTE/BUGS");
            await handleSupportFlow(msg);
            return;
        }
    }
}

module.exports = {
    handleMessage
};
