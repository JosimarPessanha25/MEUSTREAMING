import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { Send, MessageSquare, Smartphone, User, Loader2 } from 'lucide-react';

export default function Chat() {
  const [chats, setChats] = useState({}); // { [phone]: { name, device, messages: [...] } }
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [leadsMap, setLeadsMap] = useState({}); // { [rawPhone]: device }
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    initChat();

    // Conectar ao socket.io
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
  }, [leadsMap]); // Re-registra se o mapa de leads mudar para aplicar os nomes corretos

  // Rolar para a última mensagem sempre que o chat ativo ou mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, chats]);

  async function initChat() {
    try {
      // 1. Buscar Leads do Supabase para mapear dispositivos
      const { data } = await supabase.from('leads').select('phone_number, device');
      const tempMap = {};
      if (data) {
        data.forEach(lead => {
          // Limpa o telefone para bater com o formato do whatsapp
          const cleanPhone = lead.phone_number.replace('@c.us', '').replace('@lid', '');
          tempMap[cleanPhone] = lead.device;
        });
        setLeadsMap(tempMap);
      }
    } catch (err) {
      console.error('Erro ao iniciar chat:', err);
    }
  }

  function handleIncomingSocketMessage(msg) {
    const fromPhone = msg.from.replace('@c.us', '').replace('@lid', '');
    const toPhone = msg.to.replace('@c.us', '').replace('@lid', '');
    
    // O ID da conversa será sempre o telefone do cliente (não o meu)
    const chatPartner = msg.fromMe ? toPhone : fromPhone;

    setChats(prevChats => {
      const existingChat = prevChats[chatPartner] || {
        name: formatPhone(chatPartner),
        device: leadsMap[chatPartner] || null,
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
          timestamp: msg.timestamp * 1000, // converter para ms
          isMe: msg.fromMe
        }
      ];

      // Ordenar por data
      updatedMessages.sort((a, b) => a.timestamp - b.timestamp);

      return {
        ...prevChats,
        [chatPartner]: {
          ...existingChat,
          device: prevChats[chatPartner]?.device || leadsMap[chatPartner] || null,
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
          'Bypass-Tunnel-Reminder': 'true' // Ignora tela de aviso do localtunnel
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

  // Lista de conversas ordenadas por última mensagem
  const chatList = Object.keys(chats).map(phone => {
    const chat = chats[phone];
    const lastMsg = chat.messages[chat.messages.length - 1];
    return {
      phone,
      ...chat,
      lastMessage: lastMsg ? lastMsg.body : '',
      lastTime: lastMsg ? new Date(lastMsg.timestamp) : new Date(0)
    };
  }).sort((a, b) => b.lastTime - a.lastTime);

  const activeChat = activeChatId ? chats[activeChatId] : null;

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Chat ao Vivo</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Fale com os leads em tempo real diretamente pelo painel.</p>
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
            {connected ? 'Conexão Realtime Ativa' : 'Desconectado do Backend'}
          </span>
        </div>
      </div>

      {/* Container do Chat (Duas Colunas) */}
      <div className="glass-panel" style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        padding: 0, 
        flex: 1, 
        overflow: 'hidden',
        height: '100%',
        minHeight: 0 // Importante para o scroll do grid
      }}>
        
        {/* Coluna 1: Lista de Contatos */}
        <div style={{ 
          borderRight: '1px solid var(--glass-border)', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Conversas Ativas</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {chatList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Nenhuma mensagem recebida ainda no WhatsApp. Envie uma mensagem do seu celular para testar!
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
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: activeChatId === item.phone ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: activeChatId === item.phone ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    marginBottom: '5px'
                  }}
                >
                  {/* Avatar simples */}
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary-hover)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <User size={18} />
                  </div>
                  
                  {/* Detalhes */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.device ? `${item.device}` : formatPhone(item.phone)}
                      </span>
                    </div>
                    {item.device && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        {formatPhone(item.phone)}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {item.lastMessage}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna 2: Caixa da Conversa */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          
          {activeChat ? (
            <>
              {/* Header do Chat */}
              <div style={{ 
                padding: '15px 25px', 
                borderBottom: '1px solid var(--glass-border)', 
                background: 'rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-glow)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <User size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: 'white' }}>{activeChat.device ? activeChat.device : activeChat.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {activeChat.device ? activeChat.name : 'Lead de triagem'}
                  </span>
                </div>
              </div>

              {/* Mensagens */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '25px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px' 
              }}>
                {activeChat.messages.map((m, idx) => (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '65%',
                      padding: '12px 16px',
                      borderRadius: m.isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      background: m.isMe ? 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.06)',
                      border: m.isMe ? 'none' : '1px solid var(--glass-border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      color: 'white',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {m.body}
                    </div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: m.isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', 
                      textAlign: 'right', 
                      marginTop: '6px' 
                    }}>
                      {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Envio */}
              <form onSubmit={handleSend} style={{ 
                padding: '20px 25px', 
                borderTop: '1px solid var(--glass-border)', 
                background: 'rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '15px'
              }}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Digite sua mensagem para o cliente..."
                  disabled={!connected}
                  style={{ flex: 1, padding: '12px 18px' }}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || sending || !connected}
                  style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%' }}
                >
                  {sending ? (
                    <Loader2 size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <Send size={18} />
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
              <MessageSquare size={60} style={{ strokeWidth: 1, marginBottom: '20px', color: 'rgba(255,255,255,0.15)' }} />
              <h3>Selecione uma conversa</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>
                Selecione um contato na lista ao lado para ver o histórico e enviar mensagens.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
