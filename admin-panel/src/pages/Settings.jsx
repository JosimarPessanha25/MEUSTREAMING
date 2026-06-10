import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, UserPlus } from 'lucide-react';

export default function Settings() {
  const [blacklist, setBlacklist] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlacklist();
  }, []);

  async function fetchBlacklist() {
    try {
      const { data, error } = await supabase
        .from('blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Ignora o erro se a tabela não existir ainda
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

  async function handleAdd(e) {
    e.preventDefault();
    if (!newNumber) return;

    // Remove caracteres não numéricos do telefone
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
      alert('Erro Supabase: ' + (err.message || JSON.stringify(err)) + '\n\nVerifique se a tabela foi criada.');
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px' }}>Configurações do Robô</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Gerencie a Lista Negra (Blacklist). Pessoas nesta lista serão ignoradas pelo Robô de Inteligência Artificial.
      </p>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={20} />
          Adicionar Número à Lista Negra
        </h3>
        
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nome da Pessoa (Opcional)</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Minha Esposa"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Número com DDD (Obrigatório)</label>
            <input 
              type="text" 
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="Ex: 5511999999999"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              height: '45px'
            }}
          >
            Bloquear
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Pessoas Ignoradas ({blacklist.length})</h3>
        
        {loading ? (
          <p>Carregando lista...</p>
        ) : blacklist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Nenhum número na lista negra. O robô está respondendo a todos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Nome</th>
                <th style={{ padding: '15px' }}>Telefone</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {blacklist.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px' }}>{item.name || 'Sem nome'}</td>
                  <td style={{ padding: '15px', fontFamily: 'monospace' }}>{item.phone_number}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Trash2 size={16} />
                      Desbloquear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
