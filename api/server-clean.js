// Main Server Entry Point - Clean Architecture
require('dotenv').config();
const Application = require('./src/main/app');

const port = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,  // Required for Azure SQL
        trustServerCertificate: false  // Use proper SSL for Azure
    }
};

async function startServer() {
    try {
        // Create application instance
        const app = new Application();
        
        // Initialize database connection
        await app.initialize(dbConfig);
        
        // Start listening
        app.listen(port);
        
        console.log('Server started successfully with Clean Architecture');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();