const { getAiResponse } = require('../ai/bot');
const { supabase } = require('../db/supabase');

/**
 * Lida com o fluxo de Vendas (Assinatura e Teste)
 * @param {import('whatsapp-web.js').Message} msg 
 */
async function handleSalesFlow(msg) {
    const text = msg.body;

    // Extrai dados usando Regex
    const deviceMatch = text.match(/\*Dispositivo:\*\s*(.+)/i);
    const screensMatch = text.match(/\*Telas:\*\s*(.+)/i);
    const internetMatch = text.match(/\*Internet:\*\s*(.+)/i);
    const buyTodayMatch = text.match(/\*Pretende assinar hoje:\*\s*(.+)/i);
    
    const device = deviceMatch ? deviceMatch[1].trim() : "Não informado";
    const screens = screensMatch ? screensMatch[1].trim() : "Não informado";
    const internet = internetMatch ? internetMatch[1].trim() : "Não informado";
    const buyToday = buyTodayMatch ? buyTodayMatch[1].trim() : "Não informado";

    // 1. Salva no Supabase (Tabela: leads)
    try {
        const { error } = await supabase
            .from('leads')
            .insert([
                { 
                    phone_number: msg.from, 
                    device: device,
                    screens: screens,
                    internet: internet,
                    wants_to_buy_today: buyToday,
                    status: 'contatado'
                }
            ]);

        if (error) {
            console.error('Erro ao salvar lead no Supabase:', error);
        } else {
            console.log(`✅ Lead de vendas salvo no Supabase! (Dispositivo: ${device})`);
        }
    } catch (err) {
        console.error('Exceção ao acessar Supabase:', err);
    }

    // 2. Gera a resposta com a IA
    const systemPrompt = `
Você é um assistente de vendas de um serviço de Streaming (Meu Stream).
O cliente preencheu um formulário no site solicitando um teste ou uma assinatura.
A mensagem do usuário conterá variáveis como *Dispositivo:*, *Telas:*, *Internet:* e *Pretende assinar hoje:*.

Sua tarefa:
1. Ser super amigável e usar emojis.
2. Agradecer o contato e o preenchimento do formulário.
3. Avisar que você já está alertando um atendente humano do suporte para gerar o acesso ou teste grátis para o dispositivo informado.
4. Pedir para o cliente aguardar só um instante que um humano já vai prosseguir com o atendimento.

Não tente fechar a venda sozinho nem finja que está gerando o login. Deixe claro que um humano vai assumir.
`;

    const chat = await msg.getChat();
    chat.sendStateTyping();

    const response = await getAiResponse(systemPrompt, text);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    msg.reply(response);
}

module.exports = {
    handleSalesFlow
};
