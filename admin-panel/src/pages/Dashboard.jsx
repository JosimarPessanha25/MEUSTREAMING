import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Film, Wrench, Clock, CheckCircle, Smartphone, Flame } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, content: 0, support: 0, converted: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [deviceStats, setDeviceStats] = useState([])
  const [buyTodayStats, setBuyTodayStats] = useState({ yes: 0, percentage: 0 })
  const [greeting, setGreeting] = useState('Olá')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Definir saudação dinâmica
    const hrs = new Date().getHours()
    if (hrs < 12) setGreeting('Bom dia ☀️')
    else if (hrs < 18) setGreeting('Boa tarde 🌤️')
    else setGreeting('Boa noite 🌙')

    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      // 1. Contadores básicos
      const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
      const { count: contentCount } = await supabase.from('content_requests').select('*', { count: 'exact', head: true })
      const { count: supportCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true })
      const { count: convertedCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'convertido')

      setStats({
        leads: leadsCount || 0,
        content: contentCount || 0,
        support: supportCount || 0,
        converted: convertedCount || 0
      })

      // 2. Buscar dados completos de leads para gerar estatísticas de BI
      const { data: allLeads } = await supabase.from('leads').select('device, wants_to_buy_today')
      
      if (allLeads && allLeads.length > 0) {
        // Contagem de dispositivos
        const deviceMap = {}
        let yesCount = 0

        allLeads.forEach(lead => {
          // Normalizar nome do dispositivo para o gráfico
          const device = lead.device || 'Não informado'
          deviceMap[device] = (deviceMap[device] || 0) + 1

          // Quer assinar hoje
          if (lead.wants_to_buy_today?.toLowerCase() === 'sim') {
            yesCount++
          }
        });

        // Formatar estatísticas de dispositivos (pegar os 4 mais populares)
        const formattedDevices = Object.keys(deviceMap).map(name => ({
          name,
          count: deviceMap[name]
        })).sort((a, b) => b.count - a.count).slice(0, 4)

        setDeviceStats(formattedDevices)
        setBuyTodayStats({
          yes: yesCount,
          percentage: Math.round((yesCount / allLeads.length) * 100)
        })
      }

      // 3. Buscar atividades recentes (leads, conteúdo e suporte)
      const { data: recentLeads } = await supabase.from('leads').select('id, phone_number, created_at, device').order('created_at', { ascending: false }).limit(3)
      const { data: recentContent } = await supabase.from('content_requests').select('id, phone_number, created_at, title').order('created_at', { ascending: false }).limit(3)
      const { data: recentSupport } = await supabase.from('support_tickets').select('id, phone_number, created_at, title').order('created_at', { ascending: false }).limit(3)

      const activities = []

      if (recentLeads) {
        recentLeads.forEach(item => {
          activities.push({
            id: `lead-${item.id}`,
            type: 'lead',
            title: 'Novo Lead Recebido',
            detail: `Número: ${formatPhone(item.phone_number)} (Dispositivo: ${item.device})`,
            time: new Date(item.created_at)
          })
        })
      }

      if (recentContent) {
        recentContent.forEach(item => {
          activities.push({
            id: `content-${item.id}`,
            type: 'content',
            title: 'Solicitação de Filme',
            detail: `Filme/Série: "${item.title}" por ${formatPhone(item.phone_number)}`,
            time: new Date(item.created_at)
          })
        })
      }

      if (recentSupport) {
        recentSupport.forEach(item => {
          activities.push({
            id: `support-${item.id}`,
            type: 'support',
            title: 'Ticket de Suporte Aberto',
            detail: `Problema: "${item.title}" por ${formatPhone(item.phone_number)}`,
            time: new Date(item.created_at)
          })
        })
      }

      activities.sort((a, b) => b.time - a.time)
      setRecentActivities(activities.slice(0, 5))

    } catch (err) {
      console.error('Erro ao buscar dados do painel:', err)
    } finally {
      setLoading(false)
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

  const conversionRate = stats.leads > 0 ? Math.round((stats.converted / stats.leads) * 100) : 0

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{greeting}, Administrador!</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Aqui está o resumo da sua plataforma de streaming.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary" style={{ padding: '8px 16px' }}>
          Atualizar Dados
        </button>
      </div>
      
      {/* Grade de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        
        {/* Card Leads */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Total de Leads</span>
              <h1 style={{ margin: '10px 0 5px 0', fontSize: '2.5rem', background: 'none', color: 'white', WebkitTextFillColor: 'initial' }}>
                {loading ? '...' : stats.leads}
              </h1>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {stats.converted} Convertidos <CheckCircle size={14} />
              </span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Card Filmes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Pedidos de Filme</span>
              <h1 style={{ margin: '10px 0 5px 0', fontSize: '2.5rem', background: 'none', color: 'white', WebkitTextFillColor: 'initial' }}>
                {loading ? '...' : stats.content}
              </h1>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Desejos dos clientes</span>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.12)', padding: '12px', borderRadius: '12px', color: '#8b5cf6' }}>
              <Film size={24} />
            </div>
          </div>
        </div>

        {/* Card Suporte */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Tickets de Suporte</span>
              <h1 style={{ margin: '10px 0 5px 0', fontSize: '2.5rem', background: 'none', color: 'white', WebkitTextFillColor: 'initial' }}>
                {loading ? '...' : stats.support}
              </h1>
              <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '600' }}>Erros/Dúvidas reportadas</span>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
              <Wrench size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Grid Principal (Conversão e Atividades) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        
        {/* Taxa de Conversão */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px 20px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Taxa de Conversão</h3>
          <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%', 
              background: `conic-gradient(var(--primary) ${conversionRate * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)'
            }}>
              <div style={{ 
                width: '116px', 
                height: '116px', 
                borderRadius: '50%', 
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{loading ? '...' : `${conversionRate}%`}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Convertidos</span>
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px', margin: '10px 0 0 0' }}>
            De <b>{stats.leads} leads</b>, <b>{stats.converted}</b> assinaram.
          </p>
        </div>

        {/* Atividade Recente */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            Atividades Recentes
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Carregando dados...</p>
            ) : recentActivities.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Nenhuma atividade registrada ainda.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 18px', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.03)', 
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: act.type === 'lead' ? 'var(--success)' : act.type === 'support' ? 'var(--danger)' : 'var(--primary)' 
                      }}></span>
                      {act.title}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{act.detail}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {act.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Grid Secundário: BI Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
        
        {/* Dispositivos Mais Populares */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={20} style={{ color: 'var(--primary)' }} />
            Dispositivos Mais Populares
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Carregando dados...</p>
            ) : deviceStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum lead com dispositivo registrado.</p>
            ) : (
              deviceStats.map(dev => {
                const percentage = stats.leads > 0 ? Math.round((dev.count / stats.leads) * 100) : 0
                return (
                  <div key={dev.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600' }}>{dev.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{dev.count} ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), #a78bfa)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Intenção de Fechamento Imediato */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={20} style={{ color: 'var(--warning)' }} />
            Calor dos Leads
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '20px' }}>
            Porcentagem de leads que manifestaram intenção de assinar o serviço <b>hoje</b> ao preencher a triagem.
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--warning)', background: 'none', WebkitTextFillColor: 'initial' }}>
              {loading ? '...' : `${buyTodayStats.percentage}%`}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>dos leads</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${buyTodayStats.percentage}%`, height: '100%', background: 'var(--warning)', borderRadius: '4px' }}></div>
          </div>
        </div>

      </div>

    </div>
  )
}
