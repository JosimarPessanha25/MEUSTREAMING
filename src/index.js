const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handlers/messageHandler');
const { supabase, isRegisteredLead } = require('./db/supabase');
require('dotenv').config();

// Configuração do Servidor Web e WebSockets
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Servir a Landing Page (Site)
const path = require('path');
app.use(express.static(path.join(__dirname, '../Site')));

const jidCache = {};

async function getRealJid(client, jid) {
    if (!jid) return jid;
    if (!jid.endsWith('@lid')) return jid;
    if (jidCache[jid]) return jidCache[jid];
    
    try {
        const contact = await client.getContactById(jid);
        if (contact && contact.id && contact.id._serialized) {
            jidCache[jid] = contact.id._serialized;
            console.log(`[getRealJid] Resolvido JID real: ${jid} -> ${contact.id._serialized}`);
            return contact.id._serialized;
        }
    } catch (err) {
        console.warn(`[getRealJid] Falha ao resolver JID real para ${jid}:`, err.message || err);
    }
    return jid;
}

function formatMessageBody(msg) {
    if (!msg) return '';

    // Tratar tipos específicos cujos corpos brutos contêm dados binários ou formatação de sistema
    if (msg.type === 'location') {
        if (msg.location && msg.location.latitude && msg.location.longitude) {
            return `📍 [Localização] - Ver no Google Maps: https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`;
        }
        return '📍 [Localização]';
    }
    if (msg.type === 'vcard') {
        return '👤 [Contato]';
    }

    if (msg.body && msg.body.trim().length > 0) {
        return msg.body;
    }
    
    switch (msg.type) {
        case 'sticker':
            return '💟 [Figurinha]';
        case 'audio':
        case 'ptt':
            return '🎙️ [Áudio / Mensagem de Voz]';
        case 'image':
            return '📷 [Imagem]';
        case 'video':
            return '🎥 [Vídeo]';
        case 'document':
            return '📄 [Documento]';
        case 'call_log':
            return '📞 [Chamada de Voz / Vídeo]';
        default:
            return msg.type ? `📦 [Mídia: ${msg.type}]` : '📦 [Mídia]';
    }
}

// Helper robusto para resolver chat do cliente (inclusive IDs @lid, @c.us, @newsletter, @broadcast)
async function resolveChat(client, phone) {
    let chatId = phone.includes('@c.us') || phone.includes('@lid') || phone.includes('@newsletter') || phone.includes('@broadcast') ? phone : null;
    const cleanPhone = phone.replace('@c.us', '').replace('@lid', '').replace('@newsletter', '').replace('@broadcast', '').replace(/\D/g, '');
    
    // Se não veio o sufixo no ID do chat, tentamos adivinhar ou buscar no banco
    if (!chatId) {
        // 1. Procurar no Supabase o JID correto correspondente
        try {
            const { data } = await supabase
                .from('leads')
                .select('phone_number')
                .or(`phone_number.eq.${cleanPhone}@c.us,phone_number.eq.${cleanPhone}@lid,phone_number.like.%${cleanPhone}%`)
                .limit(1);
                
            if (data && data.length > 0) {
                chatId = data[0].phone_number;
                console.log(`[resolveChat] JID resolvido via Supabase para: ${chatId}`);
            }
        } catch (dbErr) {
            console.error('[resolveChat] Erro ao buscar JID no banco:', dbErr.message || dbErr);
        }
        
        // 2. Se não achou no banco, tenta buscar nos chats carregados na memória do WhatsApp
        if (!chatId) {
            try {
                const activeChats = await client.getChats();
                const foundChat = activeChats.find(c => c.id.user === cleanPhone);
                if (foundChat) {
                    chatId = foundChat.id._serialized;
                    console.log(`[resolveChat] JID resolvido via chat ativo: ${chatId}`);
                }
            } catch (chatsErr) {
                console.error('[resolveChat] Erro ao buscar nos chats ativos:', chatsErr.message || chatsErr);
            }
        }
        
        // 3. Fallback final padrão
        if (!chatId) {
            chatId = `${phone}@c.us`;
        }
    }
    
    // Tenta carregar o chat com o JID correto resolvido
    try {
        return await client.getChatById(chatId);
    } catch (err) {
        console.warn(`[resolveChat] getChatById falhou para ${chatId}: ${err.message || err}. Tentando alternativas...`);
        
        // Alternativa: Procurar nos chats ativos carregados
        try {
            const activeChats = await client.getChats();
            const foundChat = activeChats.find(c => 
                c.id._serialized === chatId || 
                c.id.user === cleanPhone
            );
            if (foundChat) return foundChat;
        } catch (chatsErr) {
            console.error('[resolveChat] Erro ao buscar chats ativos como alternativa:', chatsErr.message || chatsErr);
        }
        
        // Alternativa: Buscar o contato e obter o chat dele
        try {
            const contact = await client.getContactById(chatId);
            const contactChat = await contact.getChat();
            if (contactChat) return contactChat;
        } catch (contactErr) {
            console.error(`[resolveChat] getContactById ou contact.getChat falhou para ${chatId}:`, contactErr.message || contactErr);
        }
        
        throw err; // Se tudo falhar, joga o erro original
    }
}

// Rota de API para enviar mensagens diretamente do Painel
app.post('/api/send-message', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ error: 'Os campos "to" e "message" são necessários.' });
    }
    try {
        const chat = await resolveChat(client, to);
        await chat.sendMessage(message);
        res.json({ success: true, message: 'Mensagem enviada!' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Erro ao enviar mensagem.' });
    }
});

// Rota de API para buscar histórico recente de mensagens do celular
app.get('/api/chat-history', async (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'O parâmetro "phone" é necessário.' });
    }
    try {
        const chat = await resolveChat(client, phone);
        const messages = await chat.fetchMessages({ limit: 30 }); // buscar últimas 30 mensagens
        
        // Formatar mensagens para o front-end
        const formattedMessages = await Promise.all(messages.map(async (m) => {
            let mediaData = null;
            if (m.hasMedia) {
                try {
                    const media = await m.downloadMedia();
                    if (media) {
                        mediaData = {
                            mimetype: media.mimetype,
                            data: media.data,
                            filename: media.filename
                        };
                    }
                } catch (mediaErr) {
                    console.warn(`[Chat History] Falha ao baixar mídia para mensagem ${m.id.id}:`, mediaErr.message || mediaErr);
                }
            }
            return {
                id: m.id.id,
                body: formatMessageBody(m),
                timestamp: m.timestamp * 1000, // converter para milissegundos
                isMe: m.fromMe,
                hasMedia: m.hasMedia,
                media: mediaData
            };
        }));
        
        res.json({ success: true, messages: formattedMessages });
    } catch (err) {
        console.error('Erro ao buscar histórico:', err);
        res.status(500).json({ error: err.message || 'Erro ao buscar histórico.' });
    }
});

// Rota de API para buscar chats ativos com JID real e última mensagem carregados
app.get('/api/active-chats', async (req, res) => {
    try {
        const chats = await client.getChats();
        const filteredChats = chats.filter(c => 
            !c.isGroup && 
            !c.isReadOnly &&
            !c.id._serialized.endsWith('@newsletter') &&
            !c.id._serialized.endsWith('@broadcast') &&
            c.id._serialized !== '0@c.us'
        );

        const formattedChats = [];
        for (const c of filteredChats) {
            const realJid = await getRealJid(client, c.id._serialized);
            
            let lastMsgText = '';
            let lastTime = 0;
            if (c.lastMessage) {
                lastMsgText = formatMessageBody(c.lastMessage);
                lastTime = c.lastMessage.timestamp * 1000;
            }
            
            formattedChats.push({
                phone: realJid,
                originalJid: c.id._serialized,
                name: c.name || realJid,
                lastMessage: lastMsgText,
                lastTime: lastTime
            });
        }

        res.json({ success: true, chats: formattedChats });
    } catch (err) {
        console.error('Erro ao buscar chats ativos:', err);
        res.status(500).json({ error: err.message || 'Erro ao buscar chats ativos.' });
    }
});


// Helper para gerar Pix via Mercado Pago
async function generateMercadoPagoPix(amount, description, phone) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken || accessToken === 'APP_USR-PLACEHOLDER') {
        throw new Error('Mercado Pago não configurado. Adicione o token no arquivo .env.');
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const email = `${cleanPhone || 'cliente'}@meustream-cliente.com`;

    const payload = {
        transaction_amount: Number(amount),
        description: description || 'Assinatura Meu Stream',
        payment_method_id: 'pix',
        payer: {
            email: email,
            first_name: 'Cliente',
            last_name: 'Meu Stream'
        }
    };

    const idempotencyKey = `pix-${cleanPhone}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error('[MercadoPago API Error]', errData);
        throw new Error(errData.message || 'Erro de comunicação com o Mercado Pago.');
    }

    const data = await response.json();
    
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
    const paymentId = data.id;

    if (!qrCode) {
        throw new Error('A resposta do Mercado Pago não retornou o código de cópia e cola do Pix.');
    }

    return {
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        payment_id: paymentId
    };
}

// Rota de API para gerar Pix dinâmico do Mercado Pago
app.post('/api/generate-pix', async (req, res) => {
    const { phone, amount, description } = req.body;
    if (!phone || !amount) {
        return res.status(400).json({ error: 'Os campos "phone" e "amount" são necessários.' });
    }
    try {
        const pixData = await generateMercadoPagoPix(amount, description, phone);
        res.json({ success: true, ...pixData });
    } catch (err) {
        console.error('Erro ao gerar Pix:', err);
        res.status(500).json({ error: err.message || 'Erro ao gerar Pix.' });
    }
});

// Rota de API para enviar Pix completo (intro + QR Code imagem + Copia e Cola solto)
app.post('/api/send-pix', async (req, res) => {
    const { to, qr_code, qr_code_base64, amount } = req.body;
    if (!to || !qr_code) {
        return res.status(400).json({ error: 'Os campos "to" e "qr_code" são necessários.' });
    }
    try {
        const chat = await resolveChat(client, to);
        
        // 1. Enviar mensagem explicativa
        const formattedAmount = Number(amount).toFixed(2).replace('.', ',');
        const introText = `✅ *Pix gerado com sucesso!*\n\n` +
                          `💰 *Valor:* R$ ${formattedAmount}\n` +
                          `📝 *Descrição:* Assinatura Meu Stream\n\n` +
                          `👉 *Abaixo segue o QR Code e o código Copia e Cola (em mensagens separadas para facilitar a cópia no celular).*`;
        await chat.sendMessage(introText);

        // 2. Enviar QR Code como imagem se fornecido
        if (qr_code_base64) {
            const { MessageMedia } = require('whatsapp-web.js');
            const media = new MessageMedia('image/png', qr_code_base64);
            await client.sendMessage(chat.id._serialized, media, { caption: 'Aponte a câmera para pagar' });
        }

        // 3. Enviar o código Copia e Cola SOZINHO (sem formatação, sem texto)
        // Isso permite que o cliente apenas toque e segure a mensagem para copiar somente o código
        await chat.sendMessage(qr_code);

        res.json({ success: true, message: 'Pix enviado com sucesso!' });
    } catch (err) {
        console.error('Erro ao enviar Pix via API:', err);
        res.status(500).json({ error: err.message || 'Erro ao enviar Pix.' });
    }
});


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexões do painel local
        methods: ["GET", "POST"]
    }
});

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Variáveis de estado globais
let isConnected = false;
let currentQrCode = '';

client.on('qr', (qr) => {
    // Agora em vez de imprimir o QR code gigante no terminal,
    // nós enviamos ele via WebSockets para o Painel desenhar.
    console.log('🔄 Novo QR Code recebido. Enviando para o Painel...');
    currentQrCode = qr;
    isConnected = false;
    io.emit('qr', qr);
});

client.on('ready', () => {
    console.log('🤖 Robô de WhatsApp conectado e pronto para uso!');
    isConnected = true;
    currentQrCode = '';
    io.emit('ready');
});

client.on('disconnected', () => {
    console.log('❌ Robô de WhatsApp desconectado.');
    isConnected = false;
    currentQrCode = '';
    io.emit('disconnected');
});

// Rejeitar ligações automaticamente sem enviar avisos de texto
client.on('call', async (call) => {
    try {
        console.log(`[Call Handler] Recebendo chamada de: ${call.from}. Rejeitando silenciosamente.`);
        await call.reject();
    } catch (err) {
        console.error('[Call Handler] Erro ao rejeitar chamada:', err.message || err);
    }
});

client.on('message', async (msg) => {
    try {
        // 1. Ignora grupos, mensagens de status, newsletters e transmissões (broadcasts)
        const chat = await msg.getChat();
        const chatId = chat.id._serialized;
        if (
            msg.isStatus || 
            chat.isGroup || 
            chatId.endsWith('@newsletter') || 
            chatId.endsWith('@broadcast') ||
            msg.from.endsWith('@newsletter') ||
            msg.from.endsWith('@broadcast')
        ) {
            return;
        }

        // Resolvendo JIDs reais para contas LID
        const realFrom = await getRealJid(client, msg.from);
        const realTo = await getRealJid(client, msg.to);
        
        // Sobrescreve para que os fluxos downstream usem o número de telefone real
        msg.from = realFrom;
        msg.to = realTo;

        // 2. Consulta no Supabase se o número está na Lista Negra (blacklist)
        const senderNumber = msg.from.replace('@c.us', '').replace(/\D/g, '');
        const { data: blacklistUser, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('phone_number', senderNumber)
            .single();

        if (blacklistUser) {
            console.log(`Mensagem de ${senderNumber} ignorada (Lista Negra). Motivo: ${blacklistUser.name || 'Desconhecido'}`);
            return;
        }
    } catch (dbError) {
        // Ignorar erros se a tabela estiver vazia ou não existir ainda
        if (dbError.code !== 'PGRST116') {
             console.error('Erro ao verificar blacklist:', dbError.message || dbError);
        }
    }

    try {
        await handleMessage(client, msg);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

// Repassa TODAS as mensagens de texto em tempo real para a interface de Chat ao Vivo
client.on('message_create', async (msg) => {
    try {
        const chat = await msg.getChat();
        const chatId = chat.id._serialized;
        
        // Ignora status, grupos, newsletters e transmissões (broadcasts)
        if (
            msg.isStatus || 
            chat.isGroup || 
            chatId.endsWith('@newsletter') || 
            chatId.endsWith('@broadcast') ||
            msg.from.endsWith('@newsletter') ||
            msg.from.endsWith('@broadcast') ||
            msg.to.endsWith('@newsletter') ||
            msg.to.endsWith('@broadcast')
        ) {
            return;
        }

        // Resolvendo JIDs reais para contas LID
        const realFrom = await getRealJid(client, msg.from);
        const realTo = await getRealJid(client, msg.to);

        let mediaData = null;
        if (msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();
                if (media) {
                    mediaData = {
                        mimetype: media.mimetype,
                        data: media.data,
                        filename: media.filename
                    };
                }
            } catch (mediaErr) {
                console.warn(`[Message Create] Falha ao baixar mídia para mensagem ${msg.id.id}:`, mediaErr.message || mediaErr);
            }
        }

        io.emit('whatsapp_message', {
            id: msg.id.id,
            from: realFrom,
            to: realTo,
            body: formatMessageBody(msg),
            timestamp: msg.timestamp,
            fromMe: msg.fromMe,
            hasMedia: msg.hasMedia,
            media: mediaData
        });
    } catch (err) {
        // Silencioso se der erro ao analisar chat
    }
});

// Quando o Painel (Frontend) conectar, enviamos o status atual
io.on('connection', (socket) => {
    console.log('🌐 Painel Administrativo conectado ao backend.');
    
    // Manda o status atual logo de cara
    socket.emit('status', isConnected ? 'ready' : (currentQrCode ? 'qr' : 'initializing'));
    if (currentQrCode && !isConnected) {
        socket.emit('qr', currentQrCode);
    }

    // Se o painel pedir o status ativamente (ex: recarregou a página)
    socket.on('request_status', () => {
        socket.emit('status', isConnected ? 'ready' : (currentQrCode ? 'qr' : 'initializing'));
        if (currentQrCode && !isConnected) {
            socket.emit('qr', currentQrCode);
        }
    });
});

client.initialize();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Backend rodando na porta ${PORT}`);
});
