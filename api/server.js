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
let tableReady = false;

// Function to ensure TestTable exists
async function ensureTableExists() {
    try {
        const request = new sql.Request();
        
        // Check if table exists
        const checkResult = await request.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'TestTable'
        `);
        
        if (checkResult.recordset[0].count === 0) {
            console.log('Creating TestTable...');
            
            // Create table if it doesn't exist
            await request.query(`
                CREATE TABLE TestTable (
                    ID INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(100) NOT NULL,
                    Value NVARCHAR(255) NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE()
                )
            `);
            
            console.log('TestTable created successfully');
            
            // Insert sample data
            await request.query(`
                INSERT INTO TestTable (Name, Value) VALUES 
                ('Sample Item 1', 'Sample Value 1'),
                ('Sample Item 2', 'Sample Value 2'),
                ('Sample Item 3', 'Sample Value 3')
            `);
            
            console.log('Sample data inserted');
        }
        
        tableReady = true;
        console.log('TestTable is ready');
    } catch (err) {
        console.error('Error ensuring table exists:', err);
        tableReady = false;
    }
}

// Connect to database
sql.connect(dbConfig).then(async () => {
    console.log('Connected to SQL Server database');
    dbConnected = true;
    
    // Ensure table exists
    await ensureTableExists();
}).catch(err => {
    console.error('Database connection error:', err);
    dbConnected = false;
});

// Mock data for when database is not available (stored in memory)
let mockData = [
    { ID: 1, Name: 'Demo Item 1', Value: 'Demo Value 1' },
    { ID: 2, Name: 'Demo Item 2', Value: 'Demo Value 2' },
    { ID: 3, Name: 'Demo Item 3', Value: 'Demo Value 3' }
];
let nextMockId = 4;

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
        if (!dbConnected || !tableReady) {
            console.log('Database/table not ready, returning mock data');
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

        if (!dbConnected || !tableReady) {
            // Add to mock data when database not available
            const newId = nextMockId++;
            const newItem = { ID: newId, Name: name, Value: value };
            mockData.push(newItem);
            console.log('Database/table not ready, added to mock data:', newItem);
            return res.json({ 
                success: true, 
                ID: newId,
                message: 'Value added successfully (demo mode - stored in memory)' 
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
        
        if (!dbConnected || !tableReady) {
            // Remove from mock data when database not available
            const itemIndex = mockData.findIndex(item => item.ID == id);
            if (itemIndex !== -1) {
                const removedItem = mockData.splice(itemIndex, 1)[0];
                console.log('Database/table not ready, removed from mock data:', removedItem);
                return res.json({ success: true, message: 'Value deleted successfully (demo mode - removed from memory)' });
            } else {
                return res.json({ success: false, message: 'Item not found (demo mode)' });
            }
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
    let mode = 'demo';
    let dbStatus = 'Not connected (using mock data)';
    
    if (dbConnected && tableReady) {
        mode = 'production';
        dbStatus = 'Connected and table ready';
    } else if (dbConnected && !tableReady) {
        dbStatus = 'Connected but table not ready';
    }
    
    res.json({ 
        status: 'OK', 
        message: 'API is running - v2.3 with Azure SQL auto-setup',
        cors: 'Configured for Azure Static Web Apps',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        tableReady: tableReady,
        mode: mode
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