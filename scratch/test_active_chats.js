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
        console.log('Buscando chats ativos...');
        const chats = await client.getChats();
        console.log(`Encontrados ${chats.length} chats no total.`);
        
        const filtered = chats.filter(c => 
            !c.isGroup && 
            !c.isReadOnly &&
            !c.id._serialized.endsWith('@newsletter') &&
            !c.id._serialized.endsWith('@broadcast')
        );
        
        console.log(`\nFiltrados para chats individuais: ${filtered.length}`);
        
        for (const c of filtered.slice(0, 10)) {
            console.log(`- Chat: ${c.name} (${c.id._serialized})`);
            if (c.lastMessage) {
                console.log(`  Última mensagem: "${c.lastMessage.body}" (Timestamp: ${c.lastMessage.timestamp})`);
            } else {
                console.log('  Sem última mensagem carregada em c.lastMessage.');
            }
        }
        
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await client.destroy();
        console.log('Cliente finalizado.');
        process.exit(0);
    }
});

client.initialize();
