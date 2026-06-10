import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

export default function WhatsAppAuth() {
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('initializing'); // initializing, qr, ready, disconnected

  useEffect(() => {
    // Conecta ao servidor backend do Robô apenas quando a tela for aberta
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl);

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '10px' }}>Conexão WhatsApp</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Status do Robô: 
        <strong style={{ 
          marginLeft: '10px',
          color: status === 'ready' ? 'var(--success)' : status === 'disconnected' ? 'var(--danger)' : 'var(--warning)' 
        }}>
          {status === 'ready' ? 'CONECTADO 🤖' : status === 'qr' ? 'AGUARDANDO LEITURA' : status === 'initializing' ? 'INICIANDO...' : 'DESCONECTADO'}
        </strong>
      </p>

      {status === 'qr' && qrCode && (
        <div className="glass-card" style={{ padding: '40px', background: 'rgba(255,255,255,0.05)', display: 'inline-block' }}>
          <QRCodeSVG 
            value={qrCode} 
            size={256} 
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={true}
            style={{ borderRadius: '8px' }}
          />
          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Abra o WhatsApp no seu celular,<br/>
            vá em Aparelhos Conectados e escaneie este código.
          </p>
        </div>
      )}

      {status === 'ready' && (
        <div className="glass-card" style={{ padding: '40px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', display: 'inline-block' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
          <h3>Tudo Pronto!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            O seu Robô de WhatsApp está conectado e monitorando as mensagens.
          </p>
        </div>
      )}
    </div>
  );
}
