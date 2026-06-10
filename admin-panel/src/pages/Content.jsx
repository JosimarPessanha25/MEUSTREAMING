import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Content() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    const { data } = await supabase.from('content_requests').select('*').order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('content_requests').update({ status: newStatus }).eq('id', id)
    fetchRequests()
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Pedidos de Conteúdo</h1>
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Telefone</th>
              <th>Título Solicitado</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Nenhum pedido de filme/série ainda.</td></tr>
            ) : requests.map(req => (
              <tr key={req.id}>
                <td>{new Date(req.created_at).toLocaleDateString('pt-BR')}</td>
                <td>{req.phone_number}</td>
                <td style={{ fontWeight: 'bold' }}>{req.title}</td>
                <td>
                  <span className={`badge ${req.status === 'pendente' ? 'warning' : 'success'}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  {req.status === 'pendente' && (
                    <button onClick={() => updateStatus(req.id, 'adicionado')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)' }}>
                      Marcar Adicionado
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
