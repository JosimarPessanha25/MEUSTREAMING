import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, UserPlus, Eye, EyeOff, ShieldAlert, Key, Globe, Cpu, MessageSquare } from 'lucide-react';

export default function Settings() {
  const [blacklist, setBlacklist] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para exibir/ocultar credenciais
  const [showKeys, setShowKeys] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  // Estados dos templates de mensagem
  const [templateLead, setTemplateLead] = useState('');
  const [templateSupport, setTemplateSupport] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  useEffect(() => {
    fetchBlacklist();
    loadCredentials();
    loadTemplates();
  }, []);

  async function fetchBlacklist() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') {
          console.error('Erro ao buscar blacklist:', error);
        }
      } else {
        setBlacklist(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function loadCredentials() {
    setSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || 'Não configurado');
    setSupabaseAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY || 'Não configurado');
  }

  function loadTemplates() {
    // Carregar templates do localStorage (ou usar o valor padrão caso não existam)
    setTemplateLead(localStorage.getItem('template_lead') || 'Olá! Sou o atendimento do Meu Stream. 🎬 Vi que você solicitou um teste grátis no site para o dispositivo *{device}*! Como posso te ajudar a liberar o seu acesso agora?');
    setTemplateSupport(localStorage.getItem('template_support') || 'Olá! Sou do suporte técnico do Meu Stream. 🛠️ Recebi seu chamado sobre *"{title}"* (_{desc}_). Como posso te ajudar a resolver isso agora?');
    setTemplateContent(localStorage.getItem('template_content') || 'Olá! Sou a equipe do Meu Stream. 🍿 Vim te dar uma boa notícia! O filme/série *"{title}"* que você pediu para adicionar ao catálogo já está disponível! Já pode preparar a pipoca e aproveitar! 🎬');
  }

  function handleSaveTemplates(e) {
    e.preventDefault();
    localStorage.setItem('template_lead', templateLead);
    localStorage.setItem('template_support', templateSupport);
    localStorage.setItem('template_content', templateContent);
    alert('✅ Modelos de mensagens salvos com sucesso!');
  }

  function handleResetTemplates() {
    if (!window.confirm('Tem certeza que deseja restaurar as mensagens originais de fábrica?')) return;
    
    localStorage.removeItem('template_lead');
    localStorage.removeItem('template_support');
    localStorage.removeItem('template_content');
    loadTemplates();
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newNumber) return;

    const cleanNumber = newNumber.replace(/\D/g, '');

    try {
      const { error } = await supabase
        .from('blacklist')
        .insert([{ phone_number: cleanNumber, name: newName }]);

      if (error) throw error;

      setNewNumber('');
      setNewName('');
      fetchBlacklist();
    } catch (err) {
      console.error('Erro ao adicionar na blacklist:', err);
      alert('Erro Supabase: ' + (err.message || JSON.stringify(err)) + '\n\nVerifique se a tabela blacklist existe no banco.');
    }
  }

  async function handleRemove(id) {
    if (!window.confirm('Tem certeza que deseja remover este número da lista negra? O robô voltará a responder essa pessoa.')) return;

    try {
      const { error } = await supabase
        .from('blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBlacklist();
    } catch (err) {
      console.error('Erro ao remover da blacklist:', err);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Configurações do Robô</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Gerencie a lista negra de contatos, configure modelos de mensagens e visualize os parâmetros do seu sistema.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start', marginBottom: '40px' }}>
        
        {/* Coluna Esquerda: Formulários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Card Adicionar Bloqueado */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={20} style={{ color: 'var(--primary)' }} />
              Bloquear Contato
            </h3>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Nome ou Apelido (Opcional)</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Minha Esposa"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Número com DDD (Obrigatório)</label>
                <input 
                  type="text" 
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="Ex: 5521999999999"
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" className="btn-danger" style={{ width: '100%', height: '42px', marginTop: '5px' }}>
                <ShieldAlert size={18} />
                Bloquear Número
              </button>
            </form>
          </div>

          {/* Card Parâmetros do Sistema */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={20} style={{ color: 'var(--primary)' }} />
                Sistema
              </h3>
              <button 
                onClick={() => setShowKeys(!showKeys)} 
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px' }}
              >
                {showKeys ? <EyeOff size={14} /> : <Eye size={14} />}
                {showKeys ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <Globe size={16} style={{ color: 'var(--text-muted)', marginTop: '3px' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Supabase URL</span>
                  <div style={{ fontSize: '0.85rem', color: 'white', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '3px' }}>
                    {supabaseUrl}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <Key size={16} style={{ color: 'var(--text-muted)', marginTop: '3px' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Chave Pública (Anon Key)</span>
                  <div style={{ fontSize: '0.85rem', color: 'white', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '3px' }}>
                    {showKeys ? supabaseAnonKey : '••••••••••••••••••••••••••••••••'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Templates de Mensagens & Blacklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Card Modelos de Mensagens */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              Modelos de Mensagens (WhatsApp)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
              Customize as mensagens pré-definidas que você envia ao clicar em atender/notificar nas tabelas. Use tags dinâmicas como <code>{`{device}`}</code>, <code>{`{title}`}</code> e <code>{`{desc}`}</code>.
            </p>

            <form onSubmit={handleSaveTemplates} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Boas-vindas ao Lead (Triagem)
                </label>
                <textarea 
                  value={templateLead}
                  onChange={(e) => setTemplateLead(e.target.value)}
                  placeholder="Mensagem para novos leads..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tag disponível: <code>{`{device}`}</code></span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Atendimento de Suporte Técnico
                </label>
                <textarea 
                  value={templateSupport}
                  onChange={(e) => setTemplateSupport(e.target.value)}
                  placeholder="Mensagem para suporte..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tags disponíveis: <code>{`{title}`}</code>, <code>{`{desc}`}</code></span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Aviso de Filme Adicionado ao Catálogo
                </label>
                <textarea 
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Mensagem para notificação de filme..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tag disponível: <code>{`{title}`}</code></span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1 }}>
                  Salvar Mensagens
                </button>
                <button type="button" onClick={handleResetTemplates} className="btn-secondary">
                  Restaurar Padrão
                </button>
              </div>
            </form>
          </div>
          
          {/* Card Lista Negra */}
          <div className="glass-panel" style={{ padding: '30px', minHeight: '300px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Lista Negra ({blacklist.length})
            </h3>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Carregando números...</p>
            ) : blacklist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Nenhum número na lista negra. O robô está respondendo a todos normalmente.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table" style={{ background: 'transparent' }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ padding: '12px 15px', background: 'transparent', borderBottom: '1px solid var(--glass-border)' }}>Nome</th>
                      <th style={{ padding: '12px 15px', background: 'transparent', borderBottom: '1px solid var(--glass-border)' }}>Telefone</th>
                      <th style={{ padding: '12px 15px', background: 'transparent', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklist.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '15px 12px', fontWeight: '600' }}>
                          {item.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 'normal' }}>Sem nome</span>}
                        </td>
                        <td style={{ padding: '15px 12px', fontFamily: 'monospace' }}>
                          {item.phone_number}
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleRemove(item.id)}
                            className="btn-danger"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--danger)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              boxShadow: 'none',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} />
                            Desbloquear
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
