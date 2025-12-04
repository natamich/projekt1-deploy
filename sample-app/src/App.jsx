import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [values, setValues] = useState([])
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`

  // Load values from database
  const loadValues = async () => {
    try {
      setLoading(true)
      console.log('API_URL:', API_URL) // Debug log
      console.log('Attempting fetch to:', `${API_URL}/values`) // Debug log
      
      const response = await fetch(`${API_URL}/values`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      })
      
      console.log('Response received:', response) // Debug log
      console.log('Response status:', response.status) // Debug log
      console.log('Response headers:', [...response.headers.entries()]) // Debug log
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response body:', errorText) // Debug log
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Data received:', data) // Debug log
      setValues(data)
      setError('') // Clear any previous errors
    } catch (err) {
      console.error('Load values error:', err) // Debug log
      console.error('Error type:', err.name) // Debug log
      console.error('Error stack:', err.stack) // Debug log
      setError(`Failed to load values: ${err.message} (Check console for details)`)
    } finally {
      setLoading(false)
    }
  }

  // Add new value
  const addValue = async (e) => {
    e.preventDefault()
    if (!name.trim() || !value.trim()) {
      setError('Name and Value are required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), value: value.trim() })
      })

      if (!response.ok) throw new Error('Failed to add value')
      
      setName('')
      setValue('')
      setError('')
      await loadValues() // Refresh the list
    } catch (err) {
      setError('Failed to add value: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete value
  const deleteValue = async (id) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/values/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete value')
      
      await loadValues() // Refresh the list
    } catch (err) {
      setError('Failed to delete value: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load values on component mount
  useEffect(() => {
    loadValues()
  }, [])

  return (
    <div className="app">
      <header>
        <h1>Database Test Application</h1>
        <p>Connected to SQL Server - TestTable</p>
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <section className="add-section">
        <h2>Add New Value</h2>
        <form onSubmit={addValue}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="value">Value:</label>
            <input
              type="text"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Value'}
          </button>
        </form>
      </section>

      <section className="values-section">
        <h2>Database Values ({values.length})</h2>
        {loading && <p>Loading...</p>}
        {values.length === 0 && !loading ? (
          <p>No values found. Add some values above.</p>
        ) : (
          <div className="values-grid">
            {values.map((item) => (
              <div key={item.ID} className="value-card">
                <div className="value-header">
                  <span className="value-id">ID: {item.ID}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteValue(item.ID)}
                    disabled={loading}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <div className="value-content">
                  <strong>{item.Name}</strong>
                  <p>{item.Value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        <button onClick={loadValues} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </footer>
    </div>
  )
}

export default App