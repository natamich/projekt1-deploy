import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [currentTime, setCurrentTime] = useState('')
  const [serviceStatus, setServiceStatus] = useState({
    gitea: 'checking...',
    database: 'checking...',
    nginx: 'checking...'
  })

  useEffect(() => {
    // Update current time
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString())
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    // Simulate service status checks
    setTimeout(() => {
      setServiceStatus({
        gitea: 'running ✅',
        database: 'running ✅', 
        nginx: 'running ✅'
      })
    }, 1500)

    return () => clearInterval(timeInterval)
  }, [])

  const features = [
    {
      icon: '🔧',
      title: 'Self-Hosted',
      description: 'Complete control over your Git repositories with your own Gitea instance'
    },
    {
      icon: '🐳',
      title: 'Docker Ready',
      description: 'Containerized setup with Docker Compose for easy deployment'
    },
    {
      icon: '🚦',
      title: 'Nginx Proxy',
      description: 'Professional reverse proxy configuration for production use'
    },
    {
      icon: '💾',
      title: 'SQL Server',
      description: 'Robust database backend for reliable data storage'
    }
  ]

  return (
    <div className="container">
      <header>
        <h1>🚀 Gitea React Project</h1>
        <p>Welcome to your Gitea-powered development environment! This React application demonstrates a complete self-hosted Git solution with Docker.</p>
      </header>
      
      <div className="status-panel">
        <h3>✅ System Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="service-name">Gitea:</span>
            <span className="service-status">{serviceStatus.gitea}</span>
          </div>
          <div className="status-item">
            <span className="service-name">Database:</span>
            <span className="service-status">{serviceStatus.database}</span>
          </div>
          <div className="status-item">
            <span className="service-name">Nginx:</span>
            <span className="service-status">{serviceStatus.nginx}</span>
          </div>
        </div>
        <p className="last-updated">Last updated: {currentTime}</p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <h3>
              <span className="feature-icon">{feature.icon}</span>
              {feature.title}
            </h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="actions">
        <a href="http://localhost:3000" className="btn primary">
          🌐 Access Gitea
        </a>
        <a href="http://localhost:8081" className="btn secondary">
          📊 Database Admin
        </a>
        <button onClick={() => window.location.reload()} className="btn">
          🔄 Refresh Status
        </button>
      </div>

      <footer>
        <p>Built with ❤️ using React, Gitea, Docker, and modern web technologies</p>
      </footer>
    </div>
  )
}

export default App