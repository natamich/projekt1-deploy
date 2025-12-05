// Routes Configuration
const express = require('express');
const ValueController = require('./valueController');

function createRoutes(valueController) {
    const router = express.Router();
    
    // Bind controller methods to maintain 'this' context
    router.get('/values', valueController.getAll.bind(valueController));
    router.post('/values', valueController.create.bind(valueController));
    router.delete('/values/:id', valueController.delete.bind(valueController));
    router.get('/health', valueController.health.bind(valueController));
    
    return router;
}

module.exports = createRoutes;