// Use Cases - Business Logic Layer
const Value = require('../domain/value');

class GetAllValuesUseCase {
    constructor(valueRepository) {
        this.valueRepository = valueRepository;
    }

    async execute() {
        try {
            const values = await this.valueRepository.findAll();
            return {
                success: true,
                data: values.map(value => value.toJSON())
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

class CreateValueUseCase {
    constructor(valueRepository) {
        this.valueRepository = valueRepository;
    }

    async execute(name, value) {
        try {
            // Create domain entity
            const newValue = new Value(null, name, value);
            
            // Validate business rules
            newValue.validate();
            
            // Save to repository
            const savedValue = await this.valueRepository.create(newValue);
            
            return {
                success: true,
                data: savedValue.toJSON(),
                message: 'Value created successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

class DeleteValueUseCase {
    constructor(valueRepository) {
        this.valueRepository = valueRepository;
    }

    async execute(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Valid ID is required');
            }

            await this.valueRepository.delete(id);
            
            return {
                success: true,
                message: 'Value deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

class GetHealthUseCase {
    constructor(valueRepository) {
        this.valueRepository = valueRepository;
    }

    async execute() {
        try {
            const dbStatus = await this.valueRepository.healthCheck();
            
            return {
                success: true,
                data: {
                    status: 'OK',
                    message: 'API is running - v3.0 Clean Architecture',
                    database: dbStatus.connected ? 'Connected' : 'Not connected',
                    tableReady: dbStatus.tableReady || false,
                    mode: dbStatus.connected && dbStatus.tableReady ? 'production' : 'demo',
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = {
    GetAllValuesUseCase,
    CreateValueUseCase,
    DeleteValueUseCase,
    GetHealthUseCase
};