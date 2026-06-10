const { getAiResponse } = require('../ai/bot');
const { supabase } = require('../db/supabase');

/**
 * Lida com o fluxo de Suporte e Chamados (Bugs)
 * @param {import('whatsapp-web.js').Message} msg 
 */
async function handleSupportFlow(msg) {
    const text = msg.body;

    // Extrai o título e descrição usando Regex
    const titleMatch = text.match(/\*Título:\*\s*(.+)/i);
    const descMatch = text.match(/\*Descrição:\*\s*(.+)/i);
    
    const title = titleMatch ? titleMatch[1].trim() : "Sem título";
    const description = descMatch ? descMatch[1].trim() : "Sem descrição";

    // 1. Salva no Supabase (Tabela: support_tickets)
    try {
        const { error } = await supabase
            .from('support_tickets')
            .insert([
                { 
                    phone_number: msg.from, 
                    title: title,
                    description: description,
                    status: 'aberto'
                }
            ]);

        if (error) {
            console.error('Erro ao salvar ticket no Supabase:', error);
        } else {
            console.log(`✅ Ticket de suporte "${title}" salvo no Supabase!`);
        }
    } catch (err) {
        console.error('Exceção ao acessar Supabase:', err);
    }

    // 2. Gera a resposta com a IA
    const systemPrompt = `
Você é o assistente técnico Nível 1 do "Meu Stream".
O cliente reportou um erro ou bug através do site.
A mensagem contém o *Título:* e a *Descrição:* do problema.

Sua tarefa:
1. Ler a descrição do problema.
2. Tentar dar uma dica básica da nossa Base de Conhecimento:
   - Se o problema falar sobre "travando" ou "lento", sugira reiniciar o roteador de internet e limpar o cache do aplicativo.
   - Se o problema falar de "senha incorreta" ou "login", diga que você pode resetar a senha no sistema.
3. Sempre finalize dizendo: "Se os passos acima não resolverem, por favor me avise que vou te transferir para um de nossos atendentes técnicos humanos."

Mantenha uma postura prestativa, paciente e empática.
`;

    const chat = await msg.getChat();
    chat.sendStateTyping();

    const response = await getAiResponse(systemPrompt, text);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    msg.reply(response);
}

module.exports = {
    handleSupportFlow
};
