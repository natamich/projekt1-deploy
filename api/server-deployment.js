// Deployment Server - Self-contained Clean Architecture Implementation
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const port = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Domain - Value Entity
class Value {
    constructor(name, value) {
        if (!name || !value) {
            throw new Error('Name and value are required');
        }
        this.name = name;
        this.value = value;
    }
}

// Infrastructure - Database Repository
class MsSqlValueRepository {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.pool = null;
    }

    async initialize() {
        try {
            this.pool = await sql.connect(this.dbConfig);
            console.log('Connected to database');
            await this.ensureTableExists();
            await this.ensureSampleData();
            return true;
        } catch (error) {
            console.error('Database initialization error:', error);
            return false;
        }
    }

    async ensureTableExists() {
        try {
            const request = new sql.Request(this.pool);
            const checkTable = `
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TestTable' AND xtype='U')
                CREATE TABLE TestTable (
                    ID int IDENTITY(1,1) PRIMARY KEY,
                    Name nvarchar(255) NOT NULL,
                    Value nvarchar(255) NOT NULL,
                    created_at datetime2 DEFAULT GETDATE()
                )
            `;
            await request.query(checkTable);
            console.log('Table TestTable ready');
        } catch (error) {
            console.error('Error ensuring table exists:', error);
            throw error;
        }
    }

    async ensureSampleData() {
        try {
            const request = new sql.Request(this.pool);
            const checkData = await request.query('SELECT COUNT(*) as count FROM TestTable');
            
            if (checkData.recordset[0].count === 0) {
                const insertSample = `
                    INSERT INTO TestTable (Name, Value) VALUES 
                    ('Sample Item 2', 'Sample Value 2'),
                    ('Sample Item 3', 'Sample Value 3'),
                    ('Sample Item 4', 'Sample Value 4')
                `;
                await request.query(insertSample);
                console.log('Sample data inserted');
            }
        } catch (error) {
            console.error('Error ensuring sample data:', error);
        }
    }

    async getAll() {
        try {
            const request = new sql.Request(this.pool);
            const result = await request.query('SELECT * FROM TestTable ORDER BY created_at DESC');
            return result.recordset;
        } catch (error) {
            console.error('Error getting all values:', error);
            throw error;
        }
    }

    async create(valueEntity) {
        try {
            const request = new sql.Request(this.pool);
            request.input('name', sql.NVarChar, valueEntity.name);
            request.input('value', sql.NVarChar, valueEntity.value);
            
            const result = await request.query(`
                INSERT INTO TestTable (Name, Value) 
                OUTPUT INSERTED.* 
                VALUES (@name, @value)
            `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating value:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const request = new sql.Request(this.pool);
            request.input('id', sql.Int, id);
            
            await request.query('DELETE FROM TestTable WHERE ID = @id');
            return true;
        } catch (error) {
            console.error('Error deleting value:', error);
            throw error;
        }
    }

    async isHealthy() {
        try {
            if (!this.pool) return false;
            const request = new sql.Request(this.pool);
            await request.query('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Use Cases - Business Logic
class ValueUseCases {
    constructor(repository) {
        this.repository = repository;
    }

    async getAllValues() {
        return await this.repository.getAll();
    }

    async createValue(name, value) {
        const valueEntity = new Value(name, value);
        return await this.repository.create(valueEntity);
    }

    async deleteValue(id) {
        if (!id) throw new Error('ID is required');
        return await this.repository.delete(id);
    }

    async getHealthStatus() {
        const isHealthy = await this.repository.isHealthy();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            database: isHealthy ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString(),
            version: '3.0',
            architecture: 'Clean Architecture'
        };
    }
}

// Interface - Controllers
class ValueController {
    constructor(useCases) {
        this.useCases = useCases;
    }

    async getAll(req, res) {
        try {
            const values = await this.useCases.getAllValues();
            res.json(values);
        } catch (error) {
            console.error('Controller error in getAll:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async create(req, res) {
        try {
            const { name, value } = req.body;
            const newValue = await this.useCases.createValue(name, value);
            res.status(201).json(newValue);
        } catch (error) {
            console.error('Controller error in create:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.useCases.deleteValue(parseInt(id));
            res.status(204).send();
        } catch (error) {
            console.error('Controller error in delete:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async health(req, res) {
        try {
            const health = await this.useCases.getHealthStatus();
            res.json(health);
        } catch (error) {
            console.error('Controller error in health:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

// Application Setup
class DeploymentApplication {
    constructor() {
        this.app = express();
        this.repository = null;
        this.useCases = null;
        this.controller = null;
        this.setupMiddleware();
    }

    setupMiddleware() {
        const corsOptions = {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };

        this.app.use(cors(corsOptions));
        this.app.use(express.json());
    }

    async initialize(dbConfig) {
        // Initialize repository
        this.repository = new MsSqlValueRepository(dbConfig);
        const dbReady = await this.repository.initialize();
        
        if (!dbReady) {
            throw new Error('Failed to initialize database');
        }

        // Initialize use cases and controller
        this.useCases = new ValueUseCases(this.repository);
        this.controller = new ValueController(this.useCases);

        // Setup routes
        this.setupRoutes();
    }

    setupRoutes() {
        // API routes
        this.app.get('/api/values', this.controller.getAll.bind(this.controller));
        this.app.post('/api/values', this.controller.create.bind(this.controller));
        this.app.delete('/api/values/:id', this.controller.delete.bind(this.controller));
        this.app.get('/api/health', this.controller.health.bind(this.controller));
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({ 
                message: 'Projekt1 API is running',
                version: '3.0',
                architecture: 'Clean Architecture (Deployment)',
                endpoints: ['/api/values', '/api/health']
            });
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                version: '3.0',
                architecture: 'Clean Architecture',
                database: 'Connected',
                tableReady: true,
                mode: 'production'
            });
        });

        // Fallback CORS
        this.app.use('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    listen(port) {
        this.app.listen(port, () => {
            console.log(`API server running on port ${port}`);
            console.log('Clean Architecture deployment active');
        });
    }
}

// Main Application Start
async function startServer() {
    try {
        const app = new DeploymentApplication();
        await app.initialize(dbConfig);
        app.listen(port);
        console.log('Deployment server started successfully with Clean Architecture');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();