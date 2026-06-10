import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Trash2, MessageSquare, Check, Users, ShoppingBag } from 'lucide-react'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('todos') // todos, contatado, convertido
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0 })
  const [loading, setLoading] = useState(true)

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
        (l.device && l.device.toLowerCase().includes(term))
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

  function getWhatsAppLink(phone, device) {
    const cleanNumber = phone.replace('@c.us', '').replace('@lid', '')
    
    // Busca do localStorage ou usa o padrão de fallback
    const template = localStorage.getItem('template_lead') || 'Olá! Sou o atendimento do Meu Stream. 🎬 Vi que você solicitou um teste grátis no site para o dispositivo *{device}*! Como posso te ajudar a liberar o seu acesso agora?';
    
    // Substitui a tag dinamicamente
    const message = template.replace(/{device}/g, device);
    
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Leads & Vendas</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Gerencie e atenda os clientes que solicitaram teste grátis ou demonstraram interesse.
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        
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
            placeholder="Buscar por telefone ou TV..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px', width: '260px' }}
          />
        </div>

      </div>

      {/* Painel com Tabela */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Telefone</th>
                <th>Dispositivo</th>
                <th>Telas</th>
                <th>Internet</th>
                <th>Quer Assinar Hoje?</th>
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
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                    {formatPhone(lead.phone_number)}
                  </td>
                  <td>{lead.device}</td>
                  <td>{lead.screens}</td>
                  <td>{lead.internet}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      color: lead.wants_to_buy_today?.toLowerCase() === 'sim' ? 'var(--success)' : 'var(--text-secondary)', 
                      fontWeight: lead.wants_to_buy_today?.toLowerCase() === 'sim' ? 'bold' : 'normal' 
                    }}>
                      {lead.wants_to_buy_today}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lead.status === 'convertido' ? 'success' : 'warning'}`}>
                      {lead.status === 'convertido' ? 'Venda Fechada' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      
                      {/* Botão Chamar WhatsApp */}
                      <a 
                        href={getWhatsAppLink(lead.phone_number, lead.device)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '0.8rem', 
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)' 
                        }}
                        title="Atender no WhatsApp"
                      >
                        <MessageSquare size={14} />
                        Atender
                      </a>

                      {/* Botão Mudar Status */}
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
    </div>
  )
}
