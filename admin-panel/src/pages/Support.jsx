import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Support() {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
    if (data) setTickets(data)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', id)
    fetchTickets()
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Tickets de Suporte</h1>
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Telefone</th>
              <th>Título</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum ticket aberto! Paz e amor.</td></tr>
            ) : tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                <td>{ticket.phone_number}</td>
                <td style={{ fontWeight: 'bold' }}>{ticket.title}</td>
                <td>{ticket.description}</td>
                <td>
                  <span className={`badge ${ticket.status === 'aberto' ? 'danger' : 'success'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>
                  {ticket.status === 'aberto' && (
                    <button onClick={() => updateStatus(ticket.id, 'resolvido')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)' }}>
                      Finalizar
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
