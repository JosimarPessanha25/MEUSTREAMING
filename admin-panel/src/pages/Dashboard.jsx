import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Film, Wrench } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, content: 0, support: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    // Busca a quantidade de registros em cada tabela
    const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
    const { count: contentCount } = await supabase.from('content_requests').select('*', { count: 'exact', head: true })
    const { count: supportCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true })

    setStats({
      leads: leadsCount || 0,
      content: contentCount || 0,
      support: supportCount || 0
    })
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Visão Geral</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
              <Users size={24} />
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total de Leads</h3>
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{stats.leads}</h1>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: '12px', color: '#8b5cf6' }}>
              <Film size={24} />
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Pedidos de Filme</h3>
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{stats.content}</h1>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
              <Wrench size={24} />
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Tickets de Suporte</h3>
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{stats.support}</h1>
        </div>

      </div>
    </div>
  )
}
