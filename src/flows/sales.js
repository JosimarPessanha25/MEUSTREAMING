const { getAiResponse } = require('../ai/bot');
const { supabase } = require('../db/supabase');

/**
 * Lida com o fluxo de Vendas (Assinatura e Teste)
 * @param {import('whatsapp-web.js').Message} msg 
 */
function getSmartRecommendation(device) {
    const dev = (device || '').toLowerCase();
    
    if (dev.includes('samsung tv') || dev.includes('samsung smart')) {
        return {
            app: 'IBO Player Pro',
            instructions: 'Procure por "IBO Player Pro" na loja de aplicativos da sua TV (Samsung Apps).'
        };
    }
    if (dev.includes('lg tv') || dev.includes('lg smart')) {
        return {
            app: 'IBO Player Pro',
            instructions: 'Procure por "IBO Player Pro" na loja de aplicativos da sua TV (Content Store).'
        };
    }
    if (dev.includes('samsung antiga') || dev.includes('antiga')) {
        return {
            app: 'SmartOne',
            instructions: 'Procure por "SmartOne" na loja de aplicativos da sua TV (Samsung Apps antigas).'
        };
    }
    if (dev.includes('roku')) {
        return {
            app: 'Fun Play',
            instructions: 'Instale o aplicativo "Fun Play" na loja de canais da sua Roku TV.'
        };
    }
    if (dev.includes('android tv') || dev.includes('google tv') || dev.includes('box')) {
        return {
            app: 'Vizzion ou Fun Play',
            instructions: 'Procure por Vizzion ou Fun Play na loja oficial do aparelho (Google Play Store).'
        };
    }
    if (dev.includes('fire')) {
        return {
            app: 'App Próprio',
            instructions: 'Abra o Downloader no seu Fire Stick e baixe o nosso aplicativo próprio.'
        };
    }
    if (dev.includes('celular android') || dev.includes('android')) {
        return {
            app: 'Vizzion',
            instructions: 'Baixe o aplicativo Vizzion diretamente da Google Play Store no celular.'
        };
    }
    if (dev.includes('iphone') || dev.includes('ipad') || dev.includes('ios')) {
        return {
            app: 'IBO Player Pro',
            instructions: 'Baixe o aplicativo "IBO Player Pro" na App Store do seu iPhone/iPad.'
        };
    }
    if (dev.includes('computador')) {
        return {
            app: 'Web Player',
            instructions: 'Acesse o nosso link de Web Player pelo seu navegador de internet.'
        };
    }
    
    return {
        app: 'Fun Play ou IBO Player Pro',
        instructions: 'Procure um aplicativo compatível na loja de aplicativos do seu aparelho.'
    };
}

async function handleSalesFlow(msg) {
    const text = msg.body;

    // Extrai dados usando Regex
    const nameMatch = text.match(/\*Nome:\*\s*(.+)/i);
    const deviceMatch = text.match(/\*Dispositivo:\*\s*(.+)/i);
    const screensMatch = text.match(/\*Telas:\*\s*(.+)/i);
    const internetMatch = text.match(/\*Internet:\*\s*(.+)/i);
    const buyTodayMatch = text.match(/\*Pretende assinar:\*\s*(.+)/i);
    
    const name = nameMatch ? nameMatch[1].trim() : "Não informado";
    const device = deviceMatch ? deviceMatch[1].trim() : "Não informado";
    const screens = screensMatch ? screensMatch[1].trim() : "Não informado";
    const internet = internetMatch ? internetMatch[1].trim() : "Não informado";
    const buyToday = buyTodayMatch ? buyTodayMatch[1].trim() : "Não informado";

    const rec = getSmartRecommendation(device);
    const isMacBasedApp = rec.app.toLowerCase().includes('ibo') || rec.app.toLowerCase().includes('smartone');

    // 1. Salva no Supabase (Tabela: leads) de forma resiliente
    try {
        const { error } = await supabase
            .from('leads')
            .insert([
                { 
                    phone_number: msg.from, 
                    name: name,
                    device: device,
                    screens: screens,
                    internet: internet,
                    wants_to_buy_today: buyToday,
                    status: 'contatado',
                    assigned_app: rec.app
                }
            ]);

        if (error) {
            console.error('Erro ao salvar lead completo, tentando fallback...', error);
            const { error: fallbackError } = await supabase
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
            if (fallbackError) {
                console.error('Erro no fallback do Supabase:', fallbackError);
            } else {
                console.log(`✅ Lead salvo usando fallback (colunas novas indisponíveis no momento).`);
            }
        } else {
            console.log(`✅ Lead salvo no Supabase com todos os novos campos! (Nome: ${name}, Dispositivo: ${device}, App: ${rec.app})`);
        }
    } catch (err) {
        console.error('Exceção ao salvar lead no Supabase:', err);
    }

    // 2. Gera a resposta com a IA com o prompt de extrema brevidade e foco
    const systemPrompt = `
Você é o assistente virtual super objetivo e simpático do MEU STREAM.
O cliente acabou de preencher a triagem de teste no site e iniciou o contato no WhatsApp.

Instruções cruciais de formatação:
- Escreva uma mensagem muito curta e direta (máximo de 8 a 10 linhas no total).
- Use parágrafos pequenos e poucos emojis de forma limpa.
- NUNCA invente logins ou senhas.

Diretrizes da Mensagem:
1. Cumprimente o cliente pelo nome ("${name}") e confirme o dispositivo dele ("${device}").
2. Indique diretamente o aplicativo para ele ir instalando: *${rec.app}*.
3. Diga a instrução de instalação de forma ultra rápida: "${rec.instructions}".
4. Apresente os preços das nossas listas de canais de forma direta e sem enrolação:
   * Mensal: R$ 30,00
   * 6 meses: R$ 169,90
   * 1 ano: R$ 299,90
${isMacBasedApp ? `
5. Como o app dele é o "${rec.app}", peça para ele nos enviar uma foto da tela com o código MAC e Device Key assim que abrir o app para ativarmos.
6. ALERTA OBRIGATÓRIO: Explique de forma muito curta que o aplicativo "${rec.app}" cobra uma licença própria anual dele de R$ 18,00, e que esse valor NÃO tem nada a ver com a nossa mensalidade da lista.
` : `
5. Diga para ele nos avisar assim que tiver o app instalado, para que o atendente humano envie as credenciais (usuário e senha) em instantes.
`}
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
