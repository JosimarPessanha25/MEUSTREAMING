function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

function openTriageModal(origin) {
    const modal = document.getElementById('triage-modal');
    const modalContent = document.getElementById('triage-modal-content');
    const originInput = document.getElementById('triage-origin');
    
    // Set the origin of the click (e.g. "Plano Mensal", "Header", etc)
    originInput.value = origin;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Trigger animations after a tiny delay for the display:block to register
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('md:scale-95', 'translate-y-full');
        modalContent.classList.add('md:scale-100', 'translate-y-0');
    }, 10);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeTriageModal() {
    const modal = document.getElementById('triage-modal');
    const modalContent = document.getElementById('triage-modal-content');
    
    // Animate out
    modal.classList.add('opacity-0');
    modalContent.classList.remove('md:scale-100', 'translate-y-0');
    modalContent.classList.add('md:scale-95', 'translate-y-full');
    
    // Hide after animation finishes
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

// TMDB Integration
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZjBkZGQxY2ZmNDJiNWFiYTRmZmMwOGM0YzhhODk4ZSIsIm5iZiI6MTc2ODc4MTc3Ni4xNjk5OTk4LCJzdWIiOiI2OTZkNzdkMGNiMTk1Yzk4NTZmMTIzMGEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.rroiGo7MPFRE7YV7u_UDfFN3nRVbk1r5Jxl9Rw-Tee0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function fetchTrendingContent() {
    try {
        const options = {
            headers: {
                'Authorization': `Bearer ${TMDB_TOKEN}`,
                'accept': 'application/json'
            }
        };
        
        // Fetch 5 pages of movies and 5 pages of TV series for massive variety
        const fetchPromises = [];
        for (let i = 1; i <= 5; i++) {
            fetchPromises.push(fetch(`${TMDB_BASE_URL}/trending/movie/week?language=pt-BR&page=${i}`, options).then(res => res.json()));
            fetchPromises.push(fetch(`${TMDB_BASE_URL}/trending/tv/week?language=pt-BR&page=${i}`, options).then(res => res.json()));
        }
        
        const responses = await Promise.all(fetchPromises);
        let allResults = [];
        responses.forEach(data => {
            if (data.results) {
                allResults = allResults.concat(data.results);
            }
        });
        
        if (allResults.length > 0) {
            renderMovieCarousel(allResults);
            // Set dynamic hero background
            const itemsWithBackdrops = allResults.filter(item => item.backdrop_path);
            startHeroBackgroundCrossfade(itemsWithBackdrops);
        }
    } catch (error) {
        console.error('Error fetching TMDB content:', error);
    }
}
let currentBgLayer = 1;
function startHeroBackgroundCrossfade(itemsWithBackdrops) {
    if (itemsWithBackdrops.length === 0) return;
    
    const bg1 = document.getElementById('hero-bg-1');
    const bg2 = document.getElementById('hero-bg-2');
    if (!bg1 || !bg2) return;

    // Helper to set a random background
    const setRandomBg = (element) => {
        // Only pick from the top 20 most popular to keep quality high
        const topItems = itemsWithBackdrops.slice(0, 20);
        const randomItem = topItems[Math.floor(Math.random() * topItems.length)];
        element.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${randomItem.backdrop_path}')`;
    };

    // Initial setup
    setRandomBg(bg1);
    bg1.classList.remove('opacity-0');
    bg1.classList.add('opacity-50');

    // Crossfade every 5 seconds
    setInterval(() => {
        if (currentBgLayer === 1) {
            setRandomBg(bg2);
            bg2.classList.remove('opacity-0');
            bg2.classList.add('opacity-50');
            bg1.classList.remove('opacity-50');
            bg1.classList.add('opacity-0');
            currentBgLayer = 2;
        } else {
            setRandomBg(bg1);
            bg1.classList.remove('opacity-0');
            bg1.classList.add('opacity-50');
            bg2.classList.remove('opacity-50');
            bg2.classList.add('opacity-0');
            currentBgLayer = 1;
        }
    }, 5000);
}

const tmdbCache = new Map();

function renderMovieCarousel(items) {
    const carousel = document.getElementById('movie-carousel');
    if (!carousel) return;
    carousel.innerHTML = ''; // Clear loading skeletons

    // Filter items that have posters
    const validItems = items.filter(item => item.poster_path);
    
    // Duplicate the array to create a seamless infinite scroll effect
    const displayItems = [...validItems, ...validItems, ...validItems, ...validItems];

    displayItems.forEach(item => {
        tmdbCache.set(item.id, item);

        const title = item.title || item.name;
        
        const card = document.createElement('div');
        card.className = 'w-[120px] md:w-[200px] flex-shrink-0 cursor-pointer group relative overflow-hidden rounded-lg neon-glow border border-transparent hover:border-primary hover:scale-[1.03] transition-all duration-300 mr-4 md:mr-6';
        card.onclick = () => openDetailsModal(item.id);
        
        card.innerHTML = `
            <img src="${TMDB_IMAGE_BASE}${item.poster_path}" alt="${title}" class="w-full h-[180px] md:h-[300px] object-cover group-hover:opacity-40 transition-opacity" loading="lazy">
            <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                <span class="material-symbols-outlined text-primary text-[32px] md:text-[40px] mb-1 md:mb-2 drop-shadow-2xl">info</span>
                <span class="text-white font-bold text-[10px] md:text-sm leading-tight drop-shadow-lg">${title}</span>
            </div>
        `;
        carousel.appendChild(card);
    });
}

function openDetailsModal(id) {
    const item = tmdbCache.get(id);
    if (!item) return;

    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    
    // Populate data
    document.getElementById('details-poster').src = `${TMDB_IMAGE_BASE}${item.poster_path}`;
    document.getElementById('details-title').textContent = item.title || item.name;
    document.getElementById('details-rating').textContent = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    
    const date = item.release_date || item.first_air_date;
    document.getElementById('details-date').textContent = date ? date.split('-')[0] : 'Em breve';
    
    document.getElementById('details-type').textContent = item.media_type === 'tv' ? 'SÉRIE' : 'FILME';
    document.getElementById('details-overview').textContent = item.overview || 'Sinopse não disponível em português para este título.';
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

// Initialize TMDB content and wake up backend
document.addEventListener('DOMContentLoaded', () => {
    fetchTrendingContent();
    
    // Acorda o backend do Render de forma invisível
    const backendUrl = "https://meustreaming-backend.onrender.com";
    fetch(backendUrl).catch(() => {}); // Ignora erros, o importante é o ping bater lá
});
// Handle form submission
document.getElementById('triage-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Gather data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Build WhatsApp Message
    let message = `Olá! Tenho interesse em assinar e acabei de preencher a triagem no site.\n\n`;
    message += `*Origem:* ${data.origin}\n`;
    message += `*Dispositivo:* ${data.device}\n`;
    message += `*Telas:* ${data.screens}\n`;
    message += `*Internet:* ${data.internet}\n`;
    message += `*Já usou outro:* ${data.uses_similar}\n`;
    message += `*Precisa de ajuda:* ${data.needs_help}\n`;
    message += `*Cidade/Estado:* ${data.location}\n`;
    message += `*Como conheceu:* ${data.source}\n`;
    message += `*Procura mais:* ${data.preference}\n`;
    message += `*Pretende assinar hoje:* ${data.intent}\n\n`;
    message += `Como podemos prosseguir?`;
    
    // Encode for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "5527995250396";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Close modal
    closeTriageModal();
});
const infoModalContents = {
    'Termos de Uso': `
        <p>Estes Termos de Uso regulamentam a utilização do nosso serviço de streaming MEU STREAM.</p>
        <p>Ao acessar nosso serviço, você concorda em não compartilhar sua assinatura com terceiros fora do limite de telas estipulado no seu plano.</p>
        <p>O cancelamento pode ser feito a qualquer momento, sem taxas ocultas ou multas de fidelidade.</p>
    `,
    'Privacidade': `
        <p class="text-secondary font-bold mb-2">Política de Privacidade (LGPD)</p>
        <p>Levamos sua privacidade a sério. Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>, informamos que:</p>
        <ul class="list-disc pl-4 space-y-1">
            <li>Os dados coletados na triagem (como dispositivo, internet e localização) são utilizados estritamente para avaliação técnica de compatibilidade e garantia de qualidade do serviço.</li>
            <li>Não armazenamos seus dados de pagamento ou cartão de crédito.</li>
            <li>Não compartilhamos nem vendemos suas informações para terceiros.</li>
            <li>Você pode solicitar a exclusão de qualquer dado do seu atendimento a qualquer momento através do nosso suporte no WhatsApp.</li>
        </ul>
    `,
    'Ajuda': `
        <p>Precisa de suporte técnico?</p>
        <p>Nossa equipe está disponível via WhatsApp para te ajudar a configurar seu dispositivo, resolver possíveis travamentos ou gerenciar seu plano.</p>
        <p>Clique no botão verde de Teste Grátis em nossa página para iniciar um atendimento rápido!</p>
    `,
    'FAQ': `
        <div class="space-y-3">
            <p><strong>Preciso de antena?</strong><br>Não! Funciona 100% via internet.</p>
            <p><strong>Tem fidelidade?</strong><br>Nenhuma, você pode cancelar quando quiser sem pagar multas.</p>
            <p><strong>Posso testar antes de assinar?</strong><br>Sim! Oferecemos um teste para que você garanta que sua internet suporta a nossa qualidade sem travamentos.</p>
        </div>
    `
};

function openInfoModal(title) {
    const modal = document.getElementById('info-modal');
    const modalContent = document.getElementById('info-modal-content');
    const titleElement = document.getElementById('info-modal-title');
    const textElement = document.getElementById('info-modal-text');
    
    titleElement.textContent = title;
    textElement.innerHTML = infoModalContents[title] || "<p>Em construção...</p>";
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
    const modal = document.getElementById('info-modal');
    const modalContent = document.getElementById('info-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

// Feedback Modal Logic
function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const modalContent = document.getElementById('feedback-modal-content');
    
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('md:scale-95', 'translate-y-full');
        modalContent.classList.add('md:scale-100', 'translate-y-0');
    }, 10);
    
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    const modalContent = document.getElementById('feedback-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('md:scale-100', 'translate-y-0');
    modalContent.classList.add('md:scale-95', 'translate-y-full');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

document.getElementById('feedback-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    let message = `Olá! Tenho uma solicitação enviada pelo site:\n\n`;
    message += `*Tipo:* ${data.type}\n`;
    message += `*Título:* ${data.title}\n`;
    message += `*Descrição:* ${data.description}\n\n`;
    message += `Obrigado!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "5527995250396"; // Same number used in triage
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    closeFeedbackModal();
    e.target.reset(); // clear form for next time
});
