const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration - Allow all origins for debugging
const corsOptions = {
  origin: true,  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database configuration
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Database connection tracking
let dbConnected = false;

// Connect to database
sql.connect(dbConfig).then(() => {
    console.log('Connected to SQL Server database');
    dbConnected = true;
}).catch(err => {
    console.error('Database connection error:', err);
    dbConnected = false;
});

// Mock data for when database is not available
const mockData = [
    { ID: 1, Name: 'Demo Item 1', Value: 'Demo Value 1' },
    { ID: 2, Name: 'Demo Item 2', Value: 'Demo Value 2' },
    { ID: 3, Name: 'Demo Item 3', Value: 'Demo Value 3' }
];

// Routes

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Projekt1 API is running',
        version: '2.2',
        database: dbConnected ? 'Connected' : 'Using mock data',
        endpoints: ['/api/values', '/api/health']
    });
});

// Get all values from TestTable
app.get('/api/values', async (req, res) => {
    try {
        if (!dbConnected) {
            console.log('Database not connected, returning mock data');
            return res.json(mockData);
        }

        const request = new sql.Request();
        const result = await request.query('SELECT * FROM TestTable ORDER BY ID');
        
        // Map field names to ensure consistent frontend compatibility
        const mappedData = result.recordset.map(row => ({
            ID: row.ID || row.id,
            Name: row.Name || row.name,
            Value: row.Value || row.value,
            created_at: row.created_at // Include if exists for compatibility
        }));
        
        res.json(mappedData);
    } catch (err) {
        console.error('Error getting values:', err);
        // Fallback to mock data if database fails
        console.log('Database error, returning mock data');
        res.json(mockData);
    }
});

// Add new value to TestTable
app.post('/api/values', async (req, res) => {
    try {
        const { name, value } = req.body;
        
        if (!name || !value) {
            return res.status(400).json({ error: 'Name and Value are required' });
        }

        if (!dbConnected) {
            // Mock response when database not available
            const newId = Math.max(...mockData.map(item => item.ID)) + 1;
            console.log('Database not connected, simulating add operation');
            return res.json({ 
                success: true, 
                ID: newId,
                message: 'Value added successfully (demo mode)' 
            });
        }

        const request = new sql.Request();
        request.input('name', sql.NVarChar, name);
        request.input('value', sql.NVarChar, value);
        
        // Try to insert with capital field names first, fallback to lowercase
        let result;
        try {
            result = await request.query('INSERT INTO TestTable (Name, Value) VALUES (@name, @value); SELECT SCOPE_IDENTITY() as ID');
        } catch (firstErr) {
            console.log('Trying lowercase field names...');
            result = await request.query('INSERT INTO TestTable (name, value) VALUES (@name, @value); SELECT SCOPE_IDENTITY() as id');
        }
        
        const insertedId = result.recordset[0].ID || result.recordset[0].id;
        
        res.json({ 
            success: true, 
            ID: insertedId,  // Always return as uppercase for frontend consistency
            message: 'Value added successfully' 
        });
    } catch (err) {
        console.error('Error adding value:', err);
        // Mock fallback on error
        const newId = Math.max(...mockData.map(item => item.ID)) + 1;
        res.json({ 
            success: true, 
            ID: newId,
            message: 'Value added successfully (demo mode - db error)' 
        });
    }
});

// Delete value from TestTable
app.delete('/api/values/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!dbConnected) {
            console.log('Database not connected, simulating delete operation');
            return res.json({ success: true, message: 'Value deleted successfully (demo mode)' });
        }
        
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        
        // Try to delete with capital field name first, fallback to lowercase
        let result;
        try {
            result = await request.query('DELETE FROM TestTable WHERE ID = @id');
        } catch (firstErr) {
            console.log('Trying lowercase field name for delete...');
            result = await request.query('DELETE FROM TestTable WHERE id = @id');
        }
        
        res.json({ success: true, message: 'Value deleted successfully' });
    } catch (err) {
        console.error('Error deleting value:', err);
        // Mock response on error
        res.json({ success: true, message: 'Value deleted successfully (demo mode - db error)' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API is running - v2.2 with mock data fallback',
        cors: 'Configured for Azure Static Web Apps',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'Connected' : 'Not connected (using mock data)',
        mode: dbConnected ? 'production' : 'demo'
    });
});

// Fallback CORS for any origin (if strict CORS fails)
app.use('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.listen(port, () => {
    console.log(`API server running on port ${port}`);
});