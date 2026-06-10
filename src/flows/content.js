const { getAiResponse } = require('../ai/bot');
const { supabase } = require('../db/supabase');

/**
 * Lida com o fluxo de Solicitação de Conteúdo (Filmes/Séries)
 * @param {import('whatsapp-web.js').Message} msg 
 */
async function handleContentRequest(msg) {
    const text = msg.body;

    // Extrai o título da mensagem padronizada usando Regex
    // Exemplo: *Título:* A Casa do Dragão
    const titleMatch = text.match(/\*Título:\*\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : "Título não identificado";

    // 1. Salva no Supabase (Tabela: content_requests)
    try {
        const { error } = await supabase
            .from('content_requests')
            .insert([
                { 
                    phone_number: msg.from, 
                    title: title,
                    status: 'pendente'
                }
            ]);

        if (error) {
            console.error('Erro ao salvar pedido de conteúdo no Supabase:', error);
        } else {
            console.log(`✅ Pedido de conteúdo "${title}" salvo no Supabase!`);
        }
    } catch (err) {
        console.error('Exceção ao acessar Supabase:', err);
    }

    // 2. Gera a resposta com a IA
    const systemPrompt = `
Você é o assistente virtual do "Meu Stream". 
O cliente acaba de enviar uma solicitação de adição de conteúdo (Filme ou Série) pelo site.
A mensagem do usuário contém o *Título:* da obra desejada.

Sua tarefa:
1. Agradecer o cliente pela excelente sugestão.
2. Dizer que você vai verificar a disponibilidade do filme/série sugerido.
3. Informar que o pedido já foi encaminhado para a equipe técnica responsável pelas atualizações de catálogo.
Seja rápido, educado e animado!
`;

    const chat = await msg.getChat();
    chat.sendStateTyping();

    const response = await getAiResponse(systemPrompt, text);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    msg.reply(response);
}

module.exports = {
    handleContentRequest
};
