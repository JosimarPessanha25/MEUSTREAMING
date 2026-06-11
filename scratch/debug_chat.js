const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
    console.log('Iniciando o navegador Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Registrar logs de console da página
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
        });

        page.on('pageerror', err => {
            console.log(`[BROWSER ERROR] ${err.message}`);
        });

        console.log('Navegando para http://localhost:5173/chat...');
        await page.goto('http://localhost:5173/chat', { waitUntil: 'networkidle2' });
        
        console.log('Página carregada. Aguardando 5 segundos...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Tirar screenshot
        const screenshotPath = path.join('C:', 'Users', 'pessa', '.gemini', 'antigravity-ide', 'brain', 'a65b8e17-f7d0-4d1e-92a9-55680a91d80f', 'chat_page_debug.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot salvo em: ${screenshotPath}`);
        
        // Simular clique no primeiro contato se houver
        console.log('Tentando clicar no primeiro contato...');
        const clicked = await page.evaluate(() => {
            const contacts = document.querySelectorAll('div[style*="cursor: pointer"]');
            if (contacts.length > 0) {
                contacts[0].click();
                return true;
            }
            return false;
        });
        
        if (clicked) {
            console.log('Primeiro contato clicado. Aguardando 5 segundos para carregar o histórico...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const screenshotPathAfterClick = path.join('C:', 'Users', 'pessa', '.gemini', 'antigravity-ide', 'brain', 'a65b8e17-f7d0-4d1e-92a9-55680a91d80f', 'chat_page_debug_after_click.png');
            await page.screenshot({ path: screenshotPathAfterClick });
            console.log(`Screenshot pós-clique salvo em: ${screenshotPathAfterClick}`);
        } else {
            console.log('Nenhum contato encontrado para clicar.');
        }
        
    } catch (err) {
        console.error('Erro na execução do Puppeteer:', err);
    } finally {
        await browser.close();
        console.log('Navegador fechado.');
    }
}

run();
