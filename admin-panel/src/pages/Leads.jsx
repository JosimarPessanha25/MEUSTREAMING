import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Leads() {
  const [leads, setLeads] = useState([])

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', id)
    fetchLeads()
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Leads & Vendas</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Acompanhe os clientes que demonstraram interesse e pediram teste.
      </p>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Telefone</th>
              <th>Dispositivo</th>
              <th>Internet</th>
              <th>Quer Assinar Hoje?</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Nenhum lead encontrado.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id}>
                <td>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                <td>{lead.phone_number}</td>
                <td>{lead.device}</td>
                <td>{lead.internet}</td>
                <td>{lead.wants_to_buy_today}</td>
                <td>
                  <span className={`badge ${lead.status === 'contatado' ? 'warning' : 'success'}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  {lead.status !== 'convertido' && (
                    <button onClick={() => updateStatus(lead.id, 'convertido')} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      Marcar como Venda
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
