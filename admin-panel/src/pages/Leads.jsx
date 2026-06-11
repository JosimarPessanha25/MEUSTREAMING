import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, Trash2, MessageSquare, Check, Users, ShoppingBag, 
  X, Save, Clipboard, ExternalLink, RefreshCw, Star, Info, User
} from 'lucide-react'

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

// Construtor dinâmico de mensagem para o WhatsApp
function generateWhatsAppMessage(lead, formData) {
  const name = lead.name || 'Cliente';
  const device = lead.device || 'aparelho';
  const app = formData.assigned_app || 'Aplicativo';
  const login = formData.test_login || '______';
  const password = formData.test_password || '______';
  const val = formData.expires_at || '6 horas';
  const rec = getSmartRecommendation(device);
  
  let msg = `Olá *${name}*, aqui está o seu acesso de teste para o seu *${device}*! 🎬\n\n`;
  
  if (app.toLowerCase().includes('ibo') || app.toLowerCase().includes('smartone')) {
    msg += `📺 *Aplicativo recomendado:* _${app}_\n`;
    msg += `🚀 *Instruções:* Procure e instale o aplicativo *${app}* na loja oficial do seu aparelho.\n\n`;
    msg += `👉 *Ao abrir, ele exibirá um código MAC e/ou Device Key na tela. Me envie uma foto desses códigos aqui* para que eu possa ativar sua lista de canais!\n\n`;
    msg += `⏰ *Validade do teste:* ${val}`;
  } else {
    msg += `📺 *Aplicativo recomendado:* _${app}_\n`;
    msg += `👤 *Usuário:* \`${login}\`\n`;
    msg += `🔑 *Senha:* \`${password}\`\n\n`;
    msg += `🔥 *Instruções de instalação:* ${rec.instructions}\n\n`;
    msg += `⏰ *Validade do teste:* ${val}\n\n`;
    msg += `Qualquer dúvida na instalação, estou à disposição! 👍`;
  }
  
  return msg;
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('todos') // todos, contatado, convertido
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0 })
  const [loading, setLoading] = useState(true)

  // Estados do Modal de Ficha Interna
  const [selectedLead, setSelectedLead] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    assigned_app: '',
    test_login: '',
    test_password: '',
    expires_at: '6 horas',
    test_sent: false,
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    filterData()
  }, [leads, searchTerm, activeTab])

  async function fetchLeads() {
    try {
      setLoading(true)
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (data) {
        setLeads(data)
        
        // Calcular estatísticas locais rápidas
        const pending = data.filter(l => l.status === 'contatado').length
        const converted = data.filter(l => l.status === 'convertido').length
        setStats({
          total: data.length,
          pending: pending,
          converted: converted
        })
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
    } finally {
      setLoading(false)
    }
  }

  function filterData() {
    let result = [...leads]

    // 1. Filtrar por aba
    if (activeTab !== 'todos') {
      result = result.filter(l => l.status === activeTab)
    }

    // 2. Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(l => 
        l.phone_number.toLowerCase().includes(term) ||
        (l.device && l.device.toLowerCase().includes(term)) ||
        (l.name && l.name.toLowerCase().includes(term))
      )
    }

    setFilteredLeads(result)
  }

  async function updateStatus(id, newStatus) {
    try {
      await supabase.from('leads').update({ status: newStatus }).eq('id', id)
      fetchLeads()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  async function deleteLead(id) {
    if (!window.confirm('Tem certeza que deseja deletar este lead permanentemente?')) return
    
    try {
      await supabase.from('leads').delete().eq('id', id)
      fetchLeads()
    } catch (err) {
      console.error('Erro ao deletar lead:', err)
    }
  }

  function formatPhone(phone) {
    if (!phone) return ''
    const clean = phone.replace('@c.us', '').replace('@lid', '')
    if (clean.startsWith('55') && clean.length >= 12) {
      const ddd = clean.substring(2, 4)
      const part1 = clean.substring(4, clean.length - 4)
      const part2 = clean.substring(clean.length - 4)
      return `+55 (${ddd}) ${part1}-${part2}`
    }
    return clean
  }

  // Abre o modal de atendimento com as recomendações inteligentes
  function openAtenderModal(lead) {
    setSelectedLead(lead)
    const rec = getSmartRecommendation(lead.device)
    
    setFormData({
      name: lead.name || 'Cliente',
      assigned_app: lead.assigned_app || rec.app,
      test_login: lead.test_login || '',
      test_password: lead.test_password || '',
      expires_at: lead.expires_at || '6 horas',
      test_sent: lead.test_sent || false,
      notes: lead.notes || ''
    })
  }

  // Salva a Ficha Interna no Supabase
  async function saveFichaInterna() {
    if (!selectedLead) return
    try {
      setSaving(true)
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
        .eq('id', selectedLead.id)

      if (error) throw error
      
      // Atualiza o lead selecionado localmente para refletir as alterações no modal
      setSelectedLead(prev => ({
        ...prev,
        name: formData.name,
        assigned_app: formData.assigned_app,
        test_login: formData.test_login,
        test_password: formData.test_password,
        expires_at: formData.expires_at,
        test_sent: formData.test_sent,
        notes: formData.notes
      }))
      
      alert('Ficha de Controle Interno salva com sucesso!')
      fetchLeads()
    } catch (err) {
      console.error('Erro ao salvar ficha interna:', err)
      alert('Erro ao salvar ficha: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Copia a mensagem gerada para a área de transferência
  function copyMessageToClipboard() {
    const msgText = generateWhatsAppMessage(selectedLead, formData);
    navigator.clipboard.writeText(msgText);
    alert('Mensagem copiada com sucesso para a área de transferência!');
  }

  // Dispara o WhatsApp com a mensagem formatada
  function triggerWhatsAppSend() {
    const cleanNumber = selectedLead.phone_number.replace('@c.us', '').replace('@lid', '')
    const msgText = generateWhatsAppMessage(selectedLead, formData);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msgText)}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Leads & Vendas</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Gerencie e atenda os clientes que realizaram a triagem automatizada no site.
        </p>
      </div>

      {/* Mini Cards de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px' }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total de Solicitações</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.total}</h3>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--warning-glow)', color: 'var(--warning)', padding: '10px', borderRadius: '10px' }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contatos Pendentes</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.pending}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '10px', borderRadius: '10px' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assinaturas Fechadas</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.converted}</h3>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        
        {/* Abas */}
        <div className="tabs-container" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <button 
            onClick={() => setActiveTab('todos')} 
            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          >
            Todos ({stats.total})
          </button>
          <button 
            onClick={() => setActiveTab('contatado')} 
            className={`tab-btn ${activeTab === 'contatado' ? 'active' : ''}`}
          >
            Pendentes ({stats.pending})
          </button>
          <button 
            onClick={() => setActiveTab('convertido')} 
            className={`tab-btn ${activeTab === 'convertido' ? 'active' : ''}`}
          >
            Vendas ({stats.converted})
          </button>
        </div>

        {/* Campo Pesquisa */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', color: 'var(--text-muted)' }} />
          <input 
            type="search" 
            placeholder="Buscar por nome, telefone ou TV..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px', width: '280px' }}
          />
        </div>

      </div>

      {/* Tabela de Leads */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Dispositivo</th>
                <th>Telas</th>
                <th>Ficha Interna</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Carregando leads...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Nenhum lead encontrado com os filtros atuais.</td></tr>
              ) : filteredLeads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {lead.name || 'Sem nome'}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {formatPhone(lead.phone_number)}
                  </td>
                  <td>{lead.device}</td>
                  <td>{lead.screens}</td>
                  <td>
                    <span style={{ 
                      color: lead.test_sent ? 'var(--success)' : 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: lead.test_sent ? 'var(--success)' : '#4b5563',
                        display: 'inline-block' 
                      }}></span>
                      {lead.test_sent ? 'Teste Enviado' : 'Ficha em Branco'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lead.status === 'convertido' ? 'success' : 'warning'}`}>
                      {lead.status === 'convertido' ? 'Venda Fechada' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      
                      {/* Botão Atender (Abre modal) */}
                      <button 
                        onClick={() => openAtenderModal(lead)} 
                        className="btn"
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '0.8rem', 
                          background: 'linear-gradient(135deg, #00d1ff 0%, #007bb6 100%)', 
                          boxShadow: '0 4px 10px rgba(0, 209, 255, 0.2)' 
                        }}
                        title="Abrir Ficha de Atendimento"
                      >
                        <MessageSquare size={14} />
                        Atender
                      </button>

                      {/* Botão Rápido Venda */}
                      {lead.status !== 'convertido' ? (
                        <button 
                          onClick={() => updateStatus(lead.id, 'convertido')} 
                          className="btn-success"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Marcar como Venda Fechada"
                        >
                          <Check size={14} />
                          Vendido
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(lead.id, 'contatado')} 
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Marcar como Pendente"
                        >
                          Voltar Status
                        </button>
                      )}

                      {/* Botão Excluir */}
                      <button 
                        onClick={() => deleteLead(lead.id)} 
                        className="btn-danger"
                        style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', boxShadow: 'none' }}
                        title="Deletar Lead"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DE ATENDIMENTO E FICHA INTERNA ================= */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-scale" style={{
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '25px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            
            {/* Fechar Modal */}
            <button 
              onClick={() => setSelectedLead(null)} 
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            {/* Cabeçalho do Modal */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={24} style={{ color: 'var(--accent-primary)' }} />
                Ficha de Atendimento: {formData.name}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                WhatsApp: {formatPhone(selectedLead.phone_number)}
              </span>
            </div>

            {/* Conteúdo: 2 Colunas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '25px',
              alignItems: 'start'
            }}>
              
              {/* Coluna Esquerda: Triagem do Cliente + Recomendação */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Triagem */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '1px' }}>
                    Dados da Triagem do Site
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dispositivo</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.device}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Telas</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.screens}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Internet</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.internet || 'Não informado'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Como Conheceu</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.source || 'Não informado'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Procura mais</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.preference || 'Não informado'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pretende Assinar?</span>
                      <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{selectedLead.wants_to_buy_today || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Recomendação Inteligente (BRAVI PLAY) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.05) 0%, rgba(0, 123, 182, 0.1) 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(0, 209, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#00d1ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} fill="#00d1ff" />
                    Sugestão Automática BRAVI PLAY
                  </h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aplicativo Recomendado</span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: 'white' }}>
                      {getSmartRecommendation(selectedLead.device).app}
                    </h4>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tutorial de Instalação</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {getSmartRecommendation(selectedLead.device).instructions}
                    </p>
                  </div>
                </div>

              </div>

              {/* Coluna Direita: Ficha de Preenchimento Interno + Gerador */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Formulário de Edição Ficha Interna */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'white' }}>
                    Ficha de Uso Interno
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Editar Nome do Cliente */}
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                        Nome do Cliente
                      </label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do cliente"
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>

                    {/* Escolher Aplicativo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                          Aplicativo Liberado
                        </label>
                        <select 
                          value={formData.assigned_app} 
                          onChange={e => setFormData(prev => ({ ...prev, assigned_app: e.target.value }))}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
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
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                          Duração / Expira em
                        </label>
                        <input 
                          type="text" 
                          value={formData.expires_at} 
                          onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                          placeholder="Ex: 6 horas, 24 horas"
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        />
                      </div>
                    </div>

                    {/* Login e Senha */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                          Usuário / Login
                        </label>
                        <input 
                          type="text" 
                          value={formData.test_login} 
                          onChange={e => setFormData(prev => ({ ...prev, test_login: e.target.value }))}
                          placeholder="Usuario gerado"
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                          Senha
                        </label>
                        <input 
                          type="text" 
                          value={formData.test_password} 
                          onChange={e => setFormData(prev => ({ ...prev, test_password: e.target.value }))}
                          placeholder="Senha gerada"
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        />
                      </div>
                    </div>

                    {/* Checkbox Teste Enviado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' }}>
                      <input 
                        type="checkbox" 
                        id="test_sent_cb"
                        checked={formData.test_sent} 
                        onChange={e => setFormData(prev => ({ ...prev, test_sent: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="test_sent_cb" style={{ fontSize: '0.9rem', color: 'white', cursor: 'pointer' }}>
                        Marcar como "Teste enviado ao cliente"
                      </label>
                    </div>

                    {/* Observações */}
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                        Observações
                      </label>
                      <textarea 
                        value={formData.notes} 
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ex: Teve dúvida ao abrir o app..."
                        rows="2"
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', resize: 'vertical' }}
                      />
                    </div>

                    {/* Botão Salvar */}
                    <button 
                      onClick={saveFichaInterna} 
                      disabled={saving}
                      className="btn-success"
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginTop: '5px'
                      }}
                    >
                      <Save size={16} />
                      {saving ? 'Salvando...' : 'Salvar Ficha de Uso Interno'}
                    </button>

                  </div>
                </div>

                {/* Gerador de Mensagem WhatsApp */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clipboard size={16} />
                    Mensagem de Envio Expresso
                  </h3>
                  
                  <textarea 
                    readOnly
                    value={generateWhatsAppMessage(selectedLead, formData)}
                    rows="6"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      resize: 'none',
                      marginBottom: '15px'
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    
                    {/* Botão Copiar */}
                    <button 
                      onClick={copyMessageToClipboard}
                      className="btn-secondary"
                      style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      Copiar Mensagem
                    </button>

                    {/* Botão Enviar WhatsApp */}
                    <button 
                      onClick={triggerWhatsAppSend}
                      className="btn"
                      style={{ 
                        padding: '12px', 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                        boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)' 
                      }}
                    >
                      <ExternalLink size={14} style={{ marginRight: '6px' }} />
                      Enviar no WhatsApp
                    </button>

                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  )
}
