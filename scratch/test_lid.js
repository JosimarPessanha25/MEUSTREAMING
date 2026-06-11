const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', async () => {
    console.log('🤖 Cliente WhatsApp conectado!');
    try {
        const realJid = '5527995172109@c.us';
        console.log(`Buscando chat para o real JID: ${realJid}`);
        const chat = await client.getChatById(realJid);
        console.log('Sucesso! Chat retornado:', chat.id);
        
        console.log('Buscando mensagens...');
        const messages = await chat.fetchMessages({ limit: 5 });
        console.log(`Sucesso! Encontradas ${messages.length} mensagens.`);
        messages.forEach(m => console.log(`- ${m.fromMe ? 'Me' : 'Partner'}: ${m.body}`));
        
    } catch (err) {
        console.error('Erro ao buscar chat por JID real:', err);
    } finally {
        await client.destroy();
        console.log('Cliente finalizado.');
        process.exit(0);
    }
});

client.initialize();
