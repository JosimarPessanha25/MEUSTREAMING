import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { 
  Send, MessageSquare, Smartphone, User, Loader2, 
  Info, Star, Save, Clipboard, Check, PlusCircle, AlertCircle
} from 'lucide-react';

// Lógica de Recomendação Inteligente baseada na BRAVI PLAY
function getSmartRecommendation(device) {
  const dev = (device || '').toLowerCase();
  
  if (dev.includes('samsung tv') || dev.includes('samsung smart')) {
    return {
      app: 'IBO Player Pro',
      instructions: 'Procurar "IBO Player Pro" na loja de aplicativos da TV (Samsung Apps).'
    };
  }
  if (dev.includes('lg tv') || dev.includes('lg smart')) {
    return {
      app: 'IBO Player Pro',
      instructions: 'Procurar "IBO Player Pro" na loja de aplicativos da TV (Content Store).'
    };
  }
  if (dev.includes('samsung antiga') || dev.includes('antiga')) {
    return {
      app: 'SmartOne',
      instructions: 'Procurar "SmartOne" na loja de aplicativos da TV (Samsung Apps antigas).'
    };
  }
  if (dev.includes('roku')) {
    return {
      app: 'Fun Play',
      instructions: 'Instalar o aplicativo "Fun Play" pela Loja de Canais da Roku TV.'
    };
  }
  if (dev.includes('android tv') || dev.includes('google tv') || dev.includes('box')) {
    return {
      app: 'Vizzion / Fun Play / App Próprio',
      instructions: 'Instalar o Vizzion ou Fun Play via Play Store ou baixar nosso App Próprio por link.'
    };
  }
  if (dev.includes('fire')) {
    return {
      app: 'App Próprio',
      instructions: 'Instalar via aplicativo Downloader na Fire TV Stick utilizando nosso link direto.'
    };
  }
  if (dev.includes('celular android') || dev.includes('android')) {
    return {
      app: 'Vizzion / HD Player Pro',
      instructions: 'Baixar Vizzion ou HD Player Pro na Google Play Store do celular.'
    };
  }
  if (dev.includes('iphone') || dev.includes('ipad') || dev.includes('ios')) {
    return {
      app: 'IBO Player Pro',
      instructions: 'Instalar o "IBO Player Pro" direto da Apple App Store.'
    };
  }
  if (dev.includes('computador')) {
    return {
      app: 'Web Player',
      instructions: 'Acessar a URL do Web Player diretamente pelo navegador de internet.'
    };
  }
  
  return {
    app: 'Fun Play / IBO Player Pro',
    instructions: 'Escolher aplicativo compatível com a loja oficial do aparelho.'
  };
}

export default function Chat() {
  const [chats, setChats] = useState({}); // { [phone]: { name, device, messages: [...] } }
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [leadsMap, setLeadsMap] = useState({}); // { [rawPhone]: leadObject }
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);

  function getDisplayName(phone, chatName) {
    const lead = leadsMap[phone];
    if (lead && lead.name && lead.name !== 'Não informado' && lead.name !== 'Não Informado') {
      return lead.name;
    }
    return chatName;
  }
  
  // Estados para edição da Ficha Interna
  const [formData, setFormData] = useState({
    name: '',
    assigned_app: '',
    test_login: '',
    test_password: '',
    expires_at: '6 horas',
    test_sent: false,
    notes: ''
  });
  const [savingLead, setSavingLead] = useState(false);

  // Estados do Faturamento Pix (Mercado Pago)
  const [pixAmount, setPixAmount] = useState('30.00');
  const [customPixAmount, setCustomPixAmount] = useState('');
  const [generatingPix, setGeneratingPix] = useState(false);
  const [generatedPix, setGeneratedPix] = useState(null);
  const [sendingPix, setSendingPix] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const leadsMapRef = useRef({});

  // Sincroniza o ref de leadsMap toda vez que o estado mudar
  useEffect(() => {
    leadsMapRef.current = leadsMap;
  }, [leadsMap]);

  // Carrega contatos na inicialização (somente uma vez)
  useEffect(() => {
    initChat();
  }, []);

  // Conecta ao socket.io (somente uma vez)
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, {
      extraHeaders: {
        "Bypass-Tunnel-Reminder": "true"
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Ouvir novas mensagens do WhatsApp em tempo real
    socket.on('whatsapp_message', (msg) => {
      handleIncomingSocketMessage(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Rolar para a última mensagem sempre que o chat ativo ou mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, chats]);

  // Carrega o histórico do WhatsApp direto do celular ao abrir uma conversa
  useEffect(() => {
    if (activeChatId) {
      fetchChatHistory(activeChatId);
    }
  }, [activeChatId]);

  // Atualiza formulário da Ficha Interna quando muda o chat ativo
  useEffect(() => {
    if (activeChatId && leadsMap[activeChatId]) {
      const lead = leadsMap[activeChatId];
      const rec = getSmartRecommendation(lead.device);
      setFormData({
        name: lead.name && lead.name !== 'Não informado' && lead.name !== 'Não Informado' ? lead.name : (chats[activeChatId]?.name || 'Cliente'),
        assigned_app: lead.assigned_app || rec.app,
        test_login: lead.test_login || '',
        test_password: lead.test_password || '',
        expires_at: lead.expires_at || '6 horas',
        test_sent: lead.test_sent || false,
        notes: lead.notes || ''
      });
      setGeneratedPix(null);
    } else {
      setFormData({
        name: '',
        assigned_app: '',
        test_login: '',
        test_password: '',
        expires_at: '6 horas',
        test_sent: false,
        notes: ''
      });
      setGeneratedPix(null);
    }
  }, [activeChatId, leadsMap, chats]);

  async function fetchChatHistory(phone) {
    try {
      setLoadingHistory(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/chat-history?phone=${phone}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      const data = await response.json();
      if (data.success && data.messages) {
        setChats(prevChats => {
          const chat = prevChats[phone] || {
            name: leadsMapRef.current[phone]?.name || formatPhone(phone),
            device: leadsMapRef.current[phone]?.device || null,
            messages: []
          };
          return {
            ...prevChats,
            [phone]: {
              ...chat,
              messages: data.messages
            }
          };
        });
      }
    } catch (err) {
      console.error('Erro ao carregar histórico do chat:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function initChat() {
    try {
      // 1. Buscar Leads do Supabase
      const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      const tempMap = {};
      const initialChats = {};
      
      if (leadsData) {
        leadsData.forEach(lead => {
          const rawPhone = lead.phone_number.replace(/\D/g, '');
          tempMap[rawPhone] = lead;
          
          initialChats[rawPhone] = {
            name: lead.name || formatPhone(rawPhone),
            device: lead.device || null,
            messages: [],
            lastMessage: '',
            lastTime: new Date(0)
          };
        });
      }

      // 2. Buscar Chats Ativos do Celular via API do Backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      try {
        const response = await fetch(`${backendUrl}/api/active-chats`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true'
          }
        });
        const activeData = await response.json();
        if (activeData.success && activeData.chats) {
          activeData.chats.forEach(act => {
            const phone = act.phone.replace(/\D/g, '');
            
            // Se já existe do Supabase, preserva os dados da triagem (device)
            const existing = initialChats[phone] || {
              name: act.name || formatPhone(phone),
              device: null,
              messages: [],
              lastMessage: '',
              lastTime: new Date(0)
            };

            // Se o nome no banco de dados for "Não informado" ou igual ao telefone formatado,
            // preferimos o nome real da agenda/WhatsApp (act.name).
            let finalName = existing.name;
            const hasDatabaseName = existing.name && 
                                    existing.name !== 'Não informado' && 
                                    existing.name !== 'Não Informado' && 
                                    existing.name !== formatPhone(phone);
            
            if (!hasDatabaseName && act.name) {
              finalName = act.name;
            }

            initialChats[phone] = {
              ...existing,
              name: finalName || formatPhone(phone),
              lastMessage: act.lastMessage || existing.lastMessage || '',
              lastTime: act.lastTime ? new Date(act.lastTime) : (existing.lastTime || new Date(0))
            };
          });
        }
      } catch (activeErr) {
        console.error('Erro ao carregar chats ativos do celular:', activeErr);
      }

      setLeadsMap(tempMap);
      setChats(initialChats);
    } catch (err) {
      console.error('Erro ao iniciar chat:', err);
    }
  }

  function handleIncomingSocketMessage(msg) {
    // O ID da conversa será sempre o JID completo do cliente (não o meu) em formato apenas de dígitos
    const chatPartner = (msg.fromMe ? msg.to : msg.from).replace(/\D/g, '');

    // Ignorar grupos, newsletters e transmissões
    if (
      chatPartner.endsWith('@newsletter') || 
      chatPartner.endsWith('@broadcast') || 
      chatPartner.endsWith('@g.us')
    ) {
      return;
    }

    setChats(prevChats => {
      const existingChat = prevChats[chatPartner] || {
        name: leadsMapRef.current[chatPartner]?.name || formatPhone(chatPartner),
        device: leadsMapRef.current[chatPartner]?.device || null,
        messages: []
      };

      // Evitar mensagens duplicadas
      if (existingChat.messages.some(m => m.id === msg.id)) {
        return prevChats;
      }

      // Adiciona a nova mensagem
      const updatedMessages = [
        ...existingChat.messages,
        {
          id: msg.id,
          body: msg.body,
          timestamp: msg.timestamp * 1000,
          isMe: msg.fromMe,
          hasMedia: msg.hasMedia,
          media: msg.media
        }
      ];

      updatedMessages.sort((a, b) => a.timestamp - b.timestamp);

      return {
        ...prevChats,
        [chatPartner]: {
          ...existingChat,
          device: prevChats[chatPartner]?.device || leadsMapRef.current[chatPartner]?.device || null,
          messages: updatedMessages
        }
      };
    });
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || sending) return;

    try {
      setSending(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          to: activeChatId,
          message: inputText
        })
      });

      if (!response.ok) {
        throw new Error('Erro na requisição ao backend');
      }

      setInputText('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Falha ao enviar mensagem. Certifique-se de que o backend está ligado.');
    } finally {
      setSending(false);
    }
  }

  // Cria um lead no banco de dados para contatos que mandaram mensagem sem passar pelo site
  async function handleCreateLead() {
    if (!activeChatId) return;
    try {
      setSavingLead(true);
      const phoneToInsert = activeChatId.includes('@c.us') || activeChatId.includes('@lid') 
        ? activeChatId 
        : `${activeChatId}@c.us`;

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          phone_number: phoneToInsert,
          name: `Lead ${formatPhone(activeChatId)}`,
          device: 'Outro',
          status: 'contatado'
        }])
        .select()
        .single();

      if (error) throw error;
      
      alert('Lead criado com sucesso! Agora você pode preencher a Ficha Interna.');
      
      // Atualiza estado local
      setLeadsMap(prev => ({
        ...prev,
        [activeChatId]: data
      }));
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      alert('Erro ao criar lead: ' + err.message);
    } finally {
      setSavingLead(false);
    }
  }

  async function handleSaveFicha() {
    if (!activeChatId || !leadsMap[activeChatId]) return;
    const lead = leadsMap[activeChatId];
    try {
      setSavingLead(true);
      const { error } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          assigned_app: formData.assigned_app,
          test_login: formData.test_login,
          test_password: formData.test_password,
          expires_at: formData.expires_at,
          test_sent: formData.test_sent,
          notes: formData.notes
        })
        .eq('id', lead.id);

      if (error) throw error;

      setLeadsMap(prev => ({
        ...prev,
        [activeChatId]: {
          ...prev[activeChatId],
          name: formData.name,
          assigned_app: formData.assigned_app,
          test_login: formData.test_login,
          test_password: formData.test_password,
          expires_at: formData.expires_at,
          test_sent: formData.test_sent,
          notes: formData.notes
        }
      }));

      // Atualiza o nome da conversa na aba da esquerda
      setChats(prev => ({
        ...prev,
        [activeChatId]: {
          ...prev[activeChatId],
          name: formData.name
        }
      }));

      alert('Ficha de Controle atualizada!');
    } catch (err) {
      console.error('Erro ao salvar ficha:', err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSavingLead(false);
    }
  }

  function handlePasteCredentials() {
    const { assigned_app, test_login, test_password, expires_at } = formData;
    let text = `📺 Seus dados de acesso para o aplicativo *${assigned_app}*:\n\n`;
    if (assigned_app.toLowerCase().includes('ibo') || assigned_app.toLowerCase().includes('smartone')) {
      text += `🚀 *Instruções:* Instale o aplicativo *${assigned_app}* na loja oficial da sua TV.\n`;
      text += `👉 *Ao abrir, me envie uma foto do código MAC e Device Key que aparecem na tela* para eu ativar! ⏰ Validade: ${expires_at}`;
    } else {
      text += `👤 *Usuário:* \`${test_login}\`\n🔑 *Senha:* \`${test_password}\`\n\n⏰ *Validade do teste:* ${expires_at}\n👍 Qualquer dúvida na instalação, estou à disposição!`;
    }
    setInputText(text);
  }

  async function handleGeneratePix() {
    if (!activeChatId) return;
    const finalAmount = pixAmount === 'custom' ? parseFloat(customPixAmount) : parseFloat(pixAmount);
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      alert('Por favor, insira um valor válido de Pix maior que zero.');
      return;
    }

    try {
      setGeneratingPix(true);
      setGeneratedPix(null);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/generate-pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          phone: activeChatId,
          amount: finalAmount,
          description: `Assinatura Meu Stream - R$ ${finalAmount.toFixed(2)}`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao gerar Pix no Mercado Pago');
      }

      const data = await response.json();
      if (data.success && data.qr_code) {
        setGeneratedPix({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          amount: finalAmount
        });
      } else {
        throw new Error('Retorno inválido do servidor ao gerar Pix');
      }
    } catch (err) {
      console.error('Erro ao gerar Pix no painel:', err);
      alert('Erro ao gerar Pix: ' + err.message);
    } finally {
      setGeneratingPix(false);
    }
  }

  async function handleSendPixDirectly() {
    if (!activeChatId || !generatedPix || sendingPix) return;
    try {
      setSendingPix(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/send-pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          to: activeChatId,
          qr_code: generatedPix.qr_code,
          qr_code_base64: generatedPix.qr_code_base64,
          amount: generatedPix.amount
        })
      });

      if (!response.ok) throw new Error('Erro ao enviar Pix');
      setGeneratedPix(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar Pix: ' + err.message);
    } finally {
      setSendingPix(false);
    }
  }

  const handleQuickTemplateClick = async (tpl) => {
    if (tpl.title === 'PIX Pagamento') {
      if (!activeChatId) {
        alert('Selecione uma conversa ativa primeiro.');
        return;
      }
      
      const confirmSend = window.confirm('Deseja gerar e enviar o Pix do Mercado Pago diretamente para este cliente?');
      if (!confirmSend) return;

      const finalAmount = pixAmount === 'custom' ? parseFloat(customPixAmount) : parseFloat(pixAmount);
      const amountToUse = (finalAmount && !isNaN(finalAmount) && finalAmount > 0) ? finalAmount : 30.00;
      
      try {
        setSending(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        
        // 1. Gerar Pix no backend
        const responseGen = await fetch(`${backendUrl}/api/generate-pix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify({
            phone: activeChatId,
            amount: amountToUse,
            description: `Assinatura Meu Stream - R$ ${amountToUse.toFixed(2)}`
          })
        });

        if (!responseGen.ok) throw new Error('Erro ao gerar Pix');
        const pixData = await responseGen.json();

        // 2. Enviar Pix completo no chat do cliente
        const responseSend = await fetch(`${backendUrl}/api/send-pix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify({
            to: activeChatId,
            qr_code: pixData.qr_code,
            qr_code_base64: pixData.qr_code_base64,
            amount: amountToUse
          })
        });

        if (!responseSend.ok) throw new Error('Erro ao enviar Pix');
        
      } catch (err) {
        console.error('Erro ao gerar Pix rápido:', err);
        setInputText(tpl.text);
      } finally {
        setSending(false);
      }
    } else {
      setInputText(tpl.text);
    }
  };

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace('@c.us', '').replace('@lid', '');
    if (clean.startsWith('55') && clean.length >= 12) {
      const ddd = clean.substring(2, 4);
      const part1 = clean.substring(4, clean.length - 4);
      const part2 = clean.substring(clean.length - 4);
      return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return clean;
  }

  // Respostas rápidas
  const quickTemplates = [
    {
      title: 'Tabela de Preços',
      text: '🎬 Nossos Planos de Canais e Filmes:\n\n* Mensal: R$ 30,00\n* 6 meses: R$ 169,90\n* 1 ano: R$ 299,90\n\nQual plano você prefere assinar?'
    },
    {
      title: 'Cobrar Feedback',
      text: 'Olá! Conseguiu configurar o aplicativo e testar o sinal? O que achou da qualidade da imagem e dos conteúdos?'
    },
    {
      title: 'Aviso IBO Player R$18',
      text: 'Lembrando que o aplicativo *IBO Player Pro* cobra uma licença própria dele de R$ 18,00 por ano após o período grátis. Esse valor é cobrado pelos desenvolvedores do app e não tem relação com o valor da nossa mensalidade da lista (R$ 30,00).'
    },
    {
      title: 'PIX Pagamento',
      text: 'Perfeito! Segue nossa chave Pix (Celular) para ativação do seu plano:\n\n🔑 *5527995250396*\n👤 Nome: Josimar Pessanha\n\nAssim que realizar o pagamento, me envie o comprovante para liberação imediata!'
    }
  ];

  // Filtra contatos com base na busca
  const chatList = Object.keys(chats).map(phone => {
    const chat = chats[phone];
    const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
    
    let displayMsg = '';
    let displayTime = new Date(0);
    
    if (lastMsg) {
      displayMsg = lastMsg.body || '📷 Mídia/Anexo';
      displayTime = new Date(lastMsg.timestamp);
    } else if (chat.lastMessage) {
      displayMsg = chat.lastMessage || '📷 Mídia/Anexo';
      displayTime = chat.lastTime ? new Date(chat.lastTime) : new Date(0);
    }

    return {
      phone,
      ...chat,
      lastMessage: displayMsg,
      lastTime: displayTime
    };
  }).filter(item => {
    const term = searchContact.toLowerCase();
    const lead = leadsMap[item.phone];
    return (
      item.phone.toLowerCase().includes(term) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (lead?.device && lead.device.toLowerCase().includes(term))
    );
  }).sort((a, b) => b.lastTime - a.lastTime);

  const activeChat = activeChatId ? chats[activeChatId] : null;
  const activeLead = activeChatId ? leadsMap[activeChatId] : null;

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Atendimento Centralizado</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Converse com leads e preencha fichas internas simultaneamente.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: connected ? 'var(--success)' : 'var(--danger)',
            boxShadow: connected ? '0 0 10px var(--success)' : '0 0 10px var(--danger)'
          }}></span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {connected ? 'Conexão realtime ativa' : 'Desconectado do backend'}
          </span>
        </div>
      </div>

      {/* Grid Principal do Chat (3 Colunas) */}
      <div className="glass-panel" style={{ 
        display: 'grid', 
        gridTemplateColumns: showDetailsPanel && activeChat ? '280px 1fr 340px' : '280px 1fr', 
        padding: 0, 
        flex: 1, 
        overflow: 'hidden',
        height: '100%',
        minHeight: 0,
        transition: 'all 0.3s ease'
      }}>
        
        {/* COLUNA 1: LISTA DE CONTATOS */}
        <div style={{ 
          borderRight: '1px solid var(--glass-border)', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Campo de Busca de Contatos */}
          <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', tracking: '0.5px' }}>
              Filtro rápido
            </span>
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {chatList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum contato encontrado.
              </div>
            ) : (
              chatList.map(item => (
                <div 
                  key={item.phone}
                  onClick={() => setActiveChatId(item.phone)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: activeChatId === item.phone ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    border: activeChatId === item.phone ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    marginBottom: '5px'
                  }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: activeChatId === item.phone ? 'var(--primary-glow)' : 'rgba(255,255,255,0.04)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: activeChatId === item.phone ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    flexShrink: 0
                  }}>
                    <User size={16} />
                  </div>
                  
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getDisplayName(item.phone, item.name)}
                      </span>
                    </div>
                    {leadsMap[item.phone]?.device && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary-hover)', fontWeight: '500', marginBottom: '2px' }}>
                        📺 {leadsMap[item.phone].device}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {item.lastMessage || '(Histórico em branco)'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: JANELA DE MENSAGENS */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
          {activeChat ? (
            <>
              {/* Header do Chat */}
              <div style={{ 
                padding: '12px 20px', 
                borderBottom: '1px solid var(--glass-border)', 
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'var(--primary-glow)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <User size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>
                      {getDisplayName(activeChatId, activeChat.name)}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {activeLead ? `Triagem: ${activeLead.device}` : 'Contato manual / Sem triagem'}
                    </span>
                  </div>
                </div>

                {/* Botões do header */}
                <button 
                  onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px' }}
                  title="Toggle Painel de Informações"
                >
                  <Info size={14} />
                  {showDetailsPanel ? 'Esconder Ficha' : 'Ver Ficha'}
                </button>
              </div>

              {/* Mensagens da Conversa */}
              {loadingHistory ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)' }}>
                  <Loader2 size={36} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '15px', color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.9rem' }}>Carregando histórico com o celular...</span>
                </div>
              ) : (
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}>
                  {activeChat.messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Nenhuma mensagem no histórico local. Envie uma resposta abaixo para iniciar o bate-papo!
                    </div>
                  ) : (
                    activeChat.messages.map((m, idx) => (
                      <div 
                        key={idx}
                        style={{
                          alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: m.isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: m.isMe ? 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.05)',
                          border: m.isMe ? 'none' : '1px solid var(--glass-border)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          color: 'white'
                        }}
                      >
                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {m.hasMedia && m.media ? (
                            <div style={{ marginTop: '3px' }}>
                              {m.media.mimetype.startsWith('image/') ? (
                                <img 
                                  src={`data:${m.media.mimetype};base64,${m.media.data}`} 
                                  alt="Figurinha / Imagem" 
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: m.media.mimetype.includes('webp') ? '120px' : '250px', 
                                    borderRadius: '8px',
                                    display: 'block'
                                  }} 
                                />
                              ) : m.media.mimetype.startsWith('audio/') ? (
                                <audio 
                                  controls 
                                  src={`data:${m.media.mimetype};base64,${m.media.data}`} 
                                  style={{ 
                                    maxWidth: '100%', 
                                    display: 'block',
                                    height: '32px'
                                  }}
                                />
                              ) : m.media.mimetype.startsWith('video/') ? (
                                <video 
                                  controls 
                                  src={`data:${m.media.mimetype};base64,${m.media.data}`} 
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '250px', 
                                    borderRadius: '8px',
                                    display: 'block'
                                  }}
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                                  <span>📄 {m.media.filename || 'Arquivo de Mídia'}</span>
                                  <a 
                                    href={`data:${m.media.mimetype};base64,${m.media.data}`} 
                                    download={m.media.filename || 'arquivo'}
                                    style={{ color: 'var(--primary-hover)', textDecoration: 'underline', fontSize: '0.8rem' }}
                                  >
                                    Baixar
                                  </a>
                                </div>
                              )}
                              {m.body && !m.body.startsWith('💟') && !m.body.startsWith('🎙️') && !m.body.startsWith('📷') && !m.body.startsWith('🎥') && !m.body.startsWith('📄') && (
                                <div style={{ marginTop: '8px' }}>{m.body}</div>
                              )}
                            </div>
                          ) : (
                            m.body
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: m.isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', 
                          textAlign: 'right', 
                          marginTop: '4px' 
                        }}>
                          {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Seção de Respostas Rápidas */}
              <div style={{ 
                padding: '10px 20px', 
                background: 'rgba(0,0,0,0.15)', 
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', marginRight: '5px' }}>
                  ⚡ Rápidas:
                </span>
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickTemplateClick(tpl)}
                    className="btn-secondary"
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      background: 'rgba(255,255,255,0.03)',
                      flexShrink: 0
                    }}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>

              {/* Formulário de Input */}
              <form onSubmit={handleSend} style={{ 
                padding: '15px 20px', 
                borderTop: '1px solid var(--glass-border)', 
                background: 'rgba(0,0,0,0.25)',
                display: 'flex',
                gap: '12px'
              }}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={connected ? "Escreva uma resposta..." : "Aguardando conexão realtime..."}
                  disabled={!connected}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem' }}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || sending || !connected}
                  style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
                >
                  {sending ? (
                    <Loader2 size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1, 
              color: 'var(--text-muted)' 
            }}>
              <MessageSquare size={50} style={{ strokeWidth: 1, marginBottom: '15px', color: 'rgba(255,255,255,0.1)' }} />
              <h3 style={{ margin: '0 0 5px 0' }}>Bate-papo Ativo</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '280px', textAlign: 'center', margin: 0 }}>
                Selecione uma conversa na lista de contatos ao lado para ver o histórico e enviar mensagens.
              </p>
            </div>
          )}
        </div>

        {/* COLUNA 3: CONTROLE INTERNO / FICHA DO LEAD (LADO DIREITO) */}
        {showDetailsPanel && activeChat && (
          <div style={{ 
            borderLeft: '1px solid var(--glass-border)', 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            background: 'rgba(5, 4, 10, 0.4)',
            padding: '20px'
          }}>
            
            {activeLead ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Dados do Lead */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '0.5px' }}>
                    Triagem Realizada
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Nome Original:</span>
                      <div style={{ color: 'white', fontWeight: 'bold' }}>{activeLead.name && activeLead.name !== 'Não informado' && activeLead.name !== 'Não Informado' ? activeLead.name : (activeChat?.name || 'Não informado')}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Dispositivo:</span>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{activeLead.device}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Telas:</span>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{activeLead.screens || '1'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Internet:</span>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{activeLead.internet || 'N/A'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Quer hoje?</span>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{activeLead.wants_to_buy_today || 'N/A'}</div>
                      </div>
                    </div>
                    {activeLead.created_at && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Data da Triagem:</span>
                        <div style={{ color: 'white' }}>{new Date(activeLead.created_at).toLocaleString('pt-BR')}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recomendação Automática */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.08) 100%)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-hover)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    <Star size={14} fill="var(--primary-hover)" />
                    RECOMENDAÇÃO BRAVI PLAY
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    App: {getSmartRecommendation(activeLead.device).app}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {getSmartRecommendation(activeLead.device).instructions}
                  </div>
                </div>

                {/* Formulário Ficha Interna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'white' }}>
                    Controle de Acesso
                  </h3>

                  {/* Nome do Cliente */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Nome de Exibição
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* App Liberado */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Aplicativo Indicado
                    </label>
                    <select 
                      value={formData.assigned_app} 
                      onChange={e => setFormData(prev => ({ ...prev, assigned_app: e.target.value }))}
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem', color: 'white', background: 'rgba(0,0,0,0.3)' }}
                    >
                      <option value="IBO Player Pro">IBO Player Pro</option>
                      <option value="Fun Play">Fun Play</option>
                      <option value="SmartOne">SmartOne</option>
                      <option value="App Próprio">App Próprio</option>
                      <option value="Vizzion">Vizzion</option>
                      <option value="HD Player Pro">HD Player Pro</option>
                      <option value="EVO App">EVO App</option>
                      <option value="Smarters">Smarters</option>
                      <option value="Web Player">Web Player</option>
                    </select>
                  </div>

                  {/* Validade */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Expiração do Teste
                    </label>
                    <input 
                      type="text" 
                      value={formData.expires_at} 
                      onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                      placeholder="Ex: 6 horas, 24 horas"
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Login e Senha */}
                  {!(formData.assigned_app.toLowerCase().includes('ibo') || formData.assigned_app.toLowerCase().includes('smartone')) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Usuário
                        </label>
                        <input 
                          type="text" 
                          value={formData.test_login} 
                          onChange={e => setFormData(prev => ({ ...prev, test_login: e.target.value }))}
                          style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Senha
                        </label>
                        <input 
                          type="text" 
                          value={formData.test_password} 
                          onChange={e => setFormData(prev => ({ ...prev, test_password: e.target.value }))}
                          style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Checkbox Teste Enviado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <input 
                      type="checkbox" 
                      id="details_test_sent"
                      checked={formData.test_sent} 
                      onChange={e => setFormData(prev => ({ ...prev, test_sent: e.target.checked }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="details_test_sent" style={{ fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}>
                      Acesso de teste enviado
                    </label>
                  </div>

                  {/* Observações */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Observações Internas
                    </label>
                    <textarea 
                      value={formData.notes} 
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Alguma nota técnica..."
                      rows="2"
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </div>

                  {/* Ações da Ficha */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                    
                    {/* Botão Copiar para Chat Input */}
                    <button 
                      type="button" 
                      onClick={handlePasteCredentials}
                      className="btn"
                      style={{ 
                        padding: '10px', 
                        fontSize: '0.8rem', 
                        background: 'linear-gradient(135deg, #00d1ff 0%, #007bb6 100%)',
                        boxShadow: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <Clipboard size={14} />
                      Gerar e Colar no Chat
                    </button>

                    {/* Botão Salvar no Supabase */}
                    <button 
                      type="button" 
                      onClick={handleSaveFicha}
                      disabled={savingLead}
                      className="btn-success"
                      style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      <Save size={14} />
                      {savingLead ? 'Salvando...' : 'Salvar no Banco'}
                    </button>

                  </div>

                </div>

                {/* Seção de Faturamento Pix (Mercado Pago) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'white' }}>
                    Faturamento Pix (Mercado Pago)
                  </h3>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Valor / Plano
                    </label>
                    <select 
                      value={pixAmount} 
                      onChange={e => setPixAmount(e.target.value)}
                      style={{ width: '100%', padding: '8px', fontSize: '0.8rem', color: 'white', background: 'rgba(0,0,0,0.3)' }}
                    >
                      <option value="30.00">Plano Mensal - R$ 30,00</option>
                      <option value="169.90">Plano Semestral - R$ 169,90</option>
                      <option value="299.90">Plano Anual - R$ 299,90</option>
                      <option value="custom">Valor Customizado...</option>
                    </select>
                  </div>

                  {pixAmount === 'custom' && (
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Valor em Reais (R$)
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 50.00"
                        value={customPixAmount} 
                        onChange={e => setCustomPixAmount(e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={handleGeneratePix}
                    disabled={generatingPix}
                    className="btn"
                    style={{ 
                      padding: '10px', 
                      fontSize: '0.8rem', 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: 'none',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    {generatingPix ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                        Gerando Pix...
                      </>
                    ) : (
                      'Gerar Pix Mercado Pago'
                    )}
                  </button>

                  {generatedPix && (
                    <div style={{ 
                      marginTop: '8px', 
                      background: 'rgba(255,255,255,0.02)', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', background: 'white', padding: '10px', borderRadius: '6px' }}>
                        <img 
                          src={`data:image/png;base64,${generatedPix.qr_code_base64}`} 
                          alt="QR Code Pix" 
                          style={{ width: '150px', height: '150px' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pix Copia e Cola:</span>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          background: 'rgba(0,0,0,0.3)', 
                          padding: '6px', 
                          borderRadius: '4px',
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                          maxHeight: '60px',
                          overflowY: 'auto',
                          border: '1px solid var(--glass-border)',
                          color: '#10b981'
                        }}>
                          {generatedPix.qr_code}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleSendPixDirectly}
                        disabled={sendingPix}
                        className="btn"
                        style={{ 
                          padding: '8px', 
                          fontSize: '0.75rem', 
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          boxShadow: 'none',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        {sendingPix ? (
                          <>
                            <Loader2 size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            Enviar no Chat
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '15px' }}>
                <AlertCircle size={40} style={{ color: 'var(--warning)', strokeWidth: 1.5 }} />
                <h4 style={{ margin: 0, color: 'white' }}>Sem Ficha Associada</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Este telefone não possui registro de triagem do site. Gostaria de criar uma ficha agora para gerenciar as credenciais dele?
                </p>
                <button
                  onClick={handleCreateLead}
                  disabled={savingLead}
                  className="btn"
                  style={{ padding: '8px 12px', fontSize: '0.75rem', width: '100%', display: 'flex', gap: '5px', justifyContent: 'center' }}
                >
                  <PlusCircle size={14} />
                  {savingLead ? 'Criando...' : 'Criar Ficha do Lead'}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
