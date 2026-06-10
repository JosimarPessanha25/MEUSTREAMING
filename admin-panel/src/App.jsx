import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Film, Wrench, Smartphone, Settings as SettingsIcon } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Content from './pages/Content'
import Support from './pages/Support'
import WhatsAppAuth from './pages/WhatsAppAuth'
import Settings from './pages/Settings'

function App() {
  const location = useLocation()

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">Meu Stream Admin</div>
        
        <nav className="nav-links">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link to="/whatsapp" className={`nav-item ${location.pathname === '/whatsapp' ? 'active' : ''}`}>
            <Smartphone size={20} />
            <span>Conexão WhatsApp</span>
          </Link>
          
          <div style={{ margin: '15px 0', borderBottom: '1px solid var(--glass-border)' }}></div>

          <Link to="/leads" className={`nav-item ${location.pathname === '/leads' ? 'active' : ''}`}>
            <Users size={20} />
            <span>Leads & Vendas</span>
          </Link>
          
          <Link to="/content" className={`nav-item ${location.pathname === '/content' ? 'active' : ''}`}>
            <Film size={20} />
            <span>Conteúdo</span>
          </Link>
          
          <Link to="/support" className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}>
            <Wrench size={20} />
            <span>Suporte</span>
          </Link>

          <div style={{ margin: '15px 0', borderBottom: '1px solid var(--glass-border)' }}></div>

          <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
            <SettingsIcon size={20} />
            <span>Configurações</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/whatsapp" element={<WhatsAppAuth />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/content" element={<Content />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
