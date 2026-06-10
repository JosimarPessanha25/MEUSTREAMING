const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handlers/messageHandler');
const supabase = require('./db/supabase');
require('dotenv').config();

// Configuração do Servidor Web e WebSockets
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Servir a Landing Page (Site)
const path = require('path');
app.use(express.static(path.join(__dirname, '../Site')));

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

client.on('message', async (msg) => {
    // 1. Ignora grupos e mensagens de status
    if (msg.isStatus || (await msg.getChat()).isGroup) {
        return;
    }

    // 2. Consulta no Supabase se o número está na Lista Negra (blacklist)
    const senderNumber = msg.from.replace('@c.us', '');
    try {
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
