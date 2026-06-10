import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Trash2, MessageSquare, Check, HelpCircle, AlertTriangle } from 'lucide-react'

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('todos') // todos, aberto, resolvido
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterData()
  }, [tickets, searchTerm, activeTab])

  async function fetchTickets() {
    try {
      setLoading(true)
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
      if (data) {
        setTickets(data)
        
        const open = data.filter(t => t.status === 'aberto').length
        const resolved = data.filter(t => t.status === 'resolvido').length
        setStats({
          total: data.length,
          open: open,
          resolved: resolved
        })
      }
    } catch (err) {
      console.error('Erro ao buscar tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  function filterData() {
    let result = [...tickets]

    if (activeTab !== 'todos') {
      result = result.filter(t => t.status === activeTab)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(t => 
        t.phone_number.toLowerCase().includes(term) ||
        (t.title && t.title.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      )
    }

    setFilteredTickets(result)
  }

  async function updateStatus(id, newStatus) {
    try {
      await supabase.from('support_tickets').update({ status: newStatus }).eq('id', id)
      fetchTickets()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  async function deleteTicket(id) {
    if (!window.confirm('Tem certeza que deseja deletar este chamado permanentemente?')) return
    
    try {
      await supabase.from('support_tickets').delete().eq('id', id)
      fetchTickets()
    } catch (err) {
      console.error('Erro ao deletar ticket:', err)
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

  function getWhatsAppLink(phone, title, desc) {
    const cleanNumber = phone.replace('@c.us', '').replace('@lid', '')
    const message = `Olá! Sou do suporte técnico do Meu Stream. 🛠️ Recebi seu chamado sobre *"${title}"* (_${desc}_). Como posso te ajudar a resolver isso agora?`
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Tickets de Suporte</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Gerencie e resolva problemas técnicos ou dúvidas reportadas pelos seus clientes.
        </p>
      </div>

      {/* Estatísticas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px' }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total de Chamados</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.total}</h3>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--danger-glow)', color: 'var(--danger)', padding: '10px', borderRadius: '10px' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aguardando Suporte</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.open}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '10px', borderRadius: '10px' }}>
            <Check size={20} style={{ strokeWidth: 3 }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chamados Resolvidos</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.resolved}</h3>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        
        <div className="tabs-container" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <button 
            onClick={() => setActiveTab('todos')} 
            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          >
            Todos ({stats.total})
          </button>
          <button 
            onClick={() => setActiveTab('aberto')} 
            className={`tab-btn ${activeTab === 'aberto' ? 'active' : ''}`}
          >
            Abertos ({stats.open})
          </button>
          <button 
            onClick={() => setActiveTab('resolvido')} 
            className={`tab-btn ${activeTab === 'resolvido' ? 'active' : ''}`}
          >
            Resolvidos ({stats.resolved})
          </button>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', color: 'var(--text-muted)' }} />
          <input 
            type="search" 
            placeholder="Buscar por chamado ou texto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px', width: '260px' }}
          />
        </div>

      </div>

      {/* Tabela de Tickets */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Telefone</th>
                <th>Problema (Título)</th>
                <th>Descrição Detalhada</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Carregando chamados...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Nenhum chamado de suporte encontrado.</td></tr>
              ) : filteredTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                    {formatPhone(ticket.phone_number)}
                  </td>
                  <td style={{ fontWeight: '700', color: 'white' }}>{ticket.title}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.description}>
                    {ticket.description}
                  </td>
                  <td>
                    <span className={`badge ${ticket.status === 'resolvido' ? 'success' : 'danger'}`}>
                      {ticket.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      
                      {/* Botão Entrar em contato */}
                      <a 
                        href={getWhatsAppLink(ticket.phone_number, ticket.title, ticket.description)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '0.8rem', 
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)' 
                        }}
                        title="Atender pelo WhatsApp"
                      >
                        <MessageSquare size={14} />
                        Suporte
                      </a>

                      {/* Botão Mudar Status */}
                      {ticket.status === 'aberto' ? (
                        <button 
                          onClick={() => updateStatus(ticket.id, 'resolvido')} 
                          className="btn-success"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Marcar como Resolvido"
                        >
                          <Check size={14} />
                          Finalizar
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(ticket.id, 'aberto')} 
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Reabrir Chamado"
                        >
                          Reabrir
                        </button>
                      )}

                      {/* Botão Deletar */}
                      <button 
                        onClick={() => deleteTicket(ticket.id)} 
                        className="btn-danger"
                        style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', boxShadow: 'none' }}
                        title="Excluir Chamado"
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
