// Application Setup
const express = require('express');
const cors = require('cors');
const DIContainer = require('./container');
const createRoutes = require('../interfaces/routes');

class Application {
    constructor() {
        this.app = express();
        this.container = new DIContainer();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS configuration - Allow all origins for debugging
        const corsOptions = {
            origin: true,  // Allow all origins
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };

        this.app.use(cors(corsOptions));
        this.app.use(express.json());
    }

    setupRoutes() {
        const valueController = this.container.get('valueController');
        const apiRoutes = createRoutes(valueController);
        
        // Mount API routes
        this.app.use('/api', apiRoutes);
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({ 
                message: 'Projekt1 API is running',
                version: '3.0',
                architecture: 'Clean Architecture',
                endpoints: ['/api/values', '/api/health']
            });
        });

        // Fallback CORS for any origin (if strict CORS fails)
        this.app.use('*', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    async initialize(dbConfig) {
        await this.container.initializeDatabase(dbConfig);
    }

    listen(port) {
        this.app.listen(port, () => {
            console.log(`API server running on port ${port}`);
            console.log('Clean Architecture implementation active');
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = Application;