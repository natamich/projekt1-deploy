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

// Routes

// Get all values from TestTable
app.get('/api/values', async (req, res) => {
    try {
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
        res.status(500).json({ error: 'Failed to get values' });
    }
});

// Add new value to TestTable
app.post('/api/values', async (req, res) => {
    try {
        const { name, value } = req.body;
        
        if (!name || !value) {
            return res.status(400).json({ error: 'Name and Value are required' });
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
        res.status(500).json({ error: 'Failed to add value' });
    }
});

// Delete value from TestTable
app.delete('/api/values/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
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
        res.status(500).json({ error: 'Failed to delete value' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API is running - v2.1 with CORS fix',
        cors: 'Configured for Azure Static Web Apps',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'Connected' : 'Not connected'
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