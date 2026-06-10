import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Trash2, MessageSquare, Check, Film, Tv } from 'lucide-react'

export default function Content() {
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('todos') // todos, pendente, adicionado
  const [stats, setStats] = useState({ total: 0, pending: 0, added: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    filterData()
  }, [requests, searchTerm, activeTab])

  async function fetchRequests() {
    try {
      setLoading(true)
      const { data } = await supabase.from('content_requests').select('*').order('created_at', { ascending: false })
      if (data) {
        setRequests(data)
        
        const pending = data.filter(r => r.status === 'pendente').length
        const added = data.filter(r => r.status === 'adicionado').length
        setStats({
          total: data.length,
          pending: pending,
          added: added
        })
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }

  function filterData() {
    let result = [...requests]

    if (activeTab !== 'todos') {
      result = result.filter(r => r.status === activeTab)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(r => 
        r.phone_number.toLowerCase().includes(term) ||
        (r.title && r.title.toLowerCase().includes(term))
      )
    }

    setFilteredRequests(result)
  }

  async function updateStatus(id, newStatus) {
    try {
      await supabase.from('content_requests').update({ status: newStatus }).eq('id', id)
      fetchRequests()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  async function deleteRequest(id) {
    if (!window.confirm('Tem certeza que deseja deletar este pedido permanentemente?')) return
    
    try {
      await supabase.from('content_requests').delete().eq('id', id)
      fetchRequests()
    } catch (err) {
      console.error('Erro ao deletar pedido:', err)
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

  function getWhatsAppLink(phone, title) {
    const cleanNumber = phone.replace('@c.us', '').replace('@lid', '')
    
    // Mensagem amigável pré-definida em português
    const message = `Olá! Sou a equipe do Meu Stream. 🍿 Vim te dar uma boa notícia! O filme/série *"${title}"* que você pediu para adicionar ao catálogo já está disponível! Já pode preparar a pipoca e aproveitar! 🎬`
    
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '35px' }}>
        <h1 style={{ margin: 0 }}>Pedidos de Conteúdo</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
          Monitore quais filmes, séries ou documentários seus clientes gostariam de ver no catálogo.
        </p>
      </div>

      {/* Estatísticas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px' }}>
            <Film size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total de Pedidos</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.total}</h3>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--warning-glow)', color: 'var(--warning)', padding: '10px', borderRadius: '10px' }}>
            <Tv size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aguardando Adição</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.pending}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '10px', borderRadius: '10px' }}>
            <Check size={20} style={{ strokeWidth: 3 }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adicionados ao Catálogo</span>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{stats.added}</h3>
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
            onClick={() => setActiveTab('pendente')} 
            className={`tab-btn ${activeTab === 'pendente' ? 'active' : ''}`}
          >
            Pendentes ({stats.pending})
          </button>
          <button 
            onClick={() => setActiveTab('adicionado')} 
            className={`tab-btn ${activeTab === 'adicionado' ? 'active' : ''}`}
          >
            Adicionados ({stats.added})
          </button>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', color: 'var(--text-muted)' }} />
          <input 
            type="search" 
            placeholder="Buscar por filme ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px', width: '260px' }}
          />
        </div>

      </div>

      {/* Tabela de Pedidos */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Telefone</th>
                <th>Filme / Série Solicitado</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Carregando pedidos...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Nenhum pedido de filme ou série encontrado.</td></tr>
              ) : filteredRequests.map(req => (
                <tr key={req.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                    {formatPhone(req.phone_number)}
                  </td>
                  <td style={{ fontWeight: '700', color: 'white' }}>{req.title}</td>
                  <td>
                    <span className={`badge ${req.status === 'adicionado' ? 'success' : 'warning'}`}>
                      {req.status === 'adicionado' ? 'No Catálogo' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      
                      {/* Botão Avisar WhatsApp */}
                      <a 
                        href={getWhatsAppLink(req.phone_number, req.title)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '0.8rem', 
                          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)' 
                        }}
                        title="Notificar no WhatsApp"
                      >
                        <MessageSquare size={14} />
                        Notificar
                      </a>

                      {/* Botão Mudar Status */}
                      {req.status === 'pendente' ? (
                        <button 
                          onClick={() => updateStatus(req.id, 'adicionado')} 
                          className="btn-success"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Marcar como Adicionado ao Catálogo"
                        >
                          <Check size={14} />
                          Adicionar
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(req.id, 'pendente')} 
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          title="Marcar como Pendente"
                        >
                          Pendente
                        </button>
                      )}

                      {/* Botão Deletar */}
                      <button 
                        onClick={() => deleteRequest(req.id)} 
                        className="btn-danger"
                        style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', boxShadow: 'none' }}
                        title="Excluir Pedido"
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
