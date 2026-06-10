import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function WhatsAppAuth() {
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('initializing'); // initializing, qr, ready, disconnected

  useEffect(() => {
    // Conecta ao servidor backend do Robô apenas quando a tela for aberta
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, {
      extraHeaders: {
        "Bypass-Tunnel-Reminder": "true"
      }
    });

    // Ouve os eventos do Backend
    socket.on('status', (currentStatus) => {
      setStatus(currentStatus);
    });

    socket.on('qr', (qr) => {
      setQrCode(qr);
      setStatus('qr');
    });

    socket.on('ready', () => {
      setStatus('ready');
      setQrCode('');
    });

    socket.on('disconnected', () => {
      setStatus('disconnected');
      setQrCode('');
    });

    // Pede ativamente o status atual para o backend
    socket.emit('request_status');

    // Limpeza ao sair da tela
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Conexão WhatsApp</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Monitore o status do robô e conecte novos aparelhos via QR Code.
        </p>
      </div>

      {/* Card de Status Geral */}
      <div className="glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '30px', 
        marginBottom: '40px',
        borderLeft: `5px solid ${
          status === 'ready' ? 'var(--success)' : 
          status === 'qr' ? 'var(--warning)' : 
          status === 'disconnected' ? 'var(--danger)' : 'var(--primary)'
        }`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            padding: '15px', 
            borderRadius: '16px',
            background: 
              status === 'ready' ? 'var(--success-glow)' : 
              status === 'qr' ? 'var(--warning-glow)' : 
              status === 'disconnected' ? 'var(--danger-glow)' : 'rgba(255,255,255,0.05)',
            color: 
              status === 'ready' ? 'var(--success)' : 
              status === 'qr' ? 'var(--warning)' : 
              status === 'disconnected' ? 'var(--danger)' : 'white'
          }}>
            <Smartphone size={32} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Status da Instância</span>
            <h2 style={{ margin: '5px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {status === 'ready' && 'Online e Conectado'}
              {status === 'qr' && 'Aguardando Escaneamento'}
              {status === 'initializing' && 'Inicializando Servidor...'}
              {status === 'disconnected' && 'Desconectado'}
              
              {/* Pontinho pulsante se estiver pronto */}
              {status === 'ready' && (
                <span style={{ 
                  display: 'inline-block', 
                  width: '10px', 
                  height: '10px', 
                  background: 'var(--success)', 
                  borderRadius: '50%',
                  boxShadow: '0 0 10px var(--success)',
                  animation: 'pulse 1.5s infinite' 
                }}></span>
              )}
            </h2>
          </div>
        </div>

        <div>
          <span className={`badge ${
            status === 'ready' ? 'success' : 
            status === 'qr' ? 'warning' : 
            status === 'disconnected' ? 'danger' : 'info'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Conteúdo baseado no status */}
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        
        {/* Caso: Inicializando */}
        {status === 'initializing' && (
          <div style={{ padding: '40px 0' }}>
            <Loader2 size={64} style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite', marginBottom: '20px' }} />
            <h3>Carregando Sessão do WhatsApp</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
              O servidor do robô está abrindo o navegador interno e verificando se existe uma sessão ativa. Isso pode levar alguns segundos...
            </p>
          </div>
        )}

        {/* Caso: Desconectado */}
        {status === 'disconnected' && (
          <div style={{ padding: '30px 0' }}>
            <AlertTriangle size={64} style={{ color: 'var(--danger)', marginBottom: '20px' }} />
            <h3>Conexão Perdida</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 20px auto' }}>
              O robô foi desconectado ou o servidor local foi desligado. Verifique se o terminal está ativo no seu computador e tente novamente.
            </p>
            <button onClick={() => window.location.reload()} className="btn">
              Recarregar Painel
            </button>
          </div>
        )}

        {/* Caso: Pronto (Conectado) */}
        {status === 'ready' && (
          <div style={{ padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              background: 'var(--success-glow)', 
              color: 'var(--success)', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '25px',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}>
              <ShieldCheck size={45} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '10px' }}>Robô Ativo & Operante</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
              O robô está conectado ao seu WhatsApp e pronto para responder às triagens e solicitações de conteúdo enviadas no seu site.
            </p>
          </div>
        )}

        {/* Caso: Aguardando Leitura do QR Code */}
        {status === 'qr' && qrCode && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.2fr 1fr', 
            gap: '40px', 
            alignItems: 'center',
            textAlign: 'left',
            padding: '20px 0'
          }}>
            {/* Coluna 1: QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: '40px' }}>
              <div style={{ 
                padding: '25px', 
                background: 'white', 
                borderRadius: '24px', 
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'inline-block'
              }}>
                <QRCodeSVG 
                  value={qrCode} 
                  size={240} 
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"M"}
                  includeMargin={false}
                />
              </div>
              <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                O código atualiza automaticamente a cada 20 segundos.
              </p>
            </div>

            {/* Coluna 2: Instruções */}
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '20px' }}>Como conectar:</h3>
              <ol style={{ 
                paddingLeft: '20px', 
                margin: 0, 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                <li>Abra o <b>WhatsApp</b> no seu celular.</li>
                <li>Toque em <b>Mais Opções</b> (três pontinhos no Android) ou <b>Configurações</b> (no iPhone).</li>
                <li>Selecione <b>Aparelhos Conectados</b>.</li>
                <li>Clique em <b>Conectar um Aparelho</b>.</li>
                <li>Aponte a câmera do seu celular para este QR Code para iniciar a sincronização.</li>
              </ol>
            </div>
          </div>
        )}

      </div>

      {/* Adicionar regra CSS de animações extras no escopo deste componente */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
