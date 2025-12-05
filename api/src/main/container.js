// Dependency Injection Container
const MsSqlValueRepository = require('../infrastructure/msSqlValueRepository');
const { 
    GetAllValuesUseCase, 
    CreateValueUseCase, 
    DeleteValueUseCase, 
    GetHealthUseCase 
} = require('../use-cases/valueUseCases');
const ValueController = require('../interfaces/valueController');

class DIContainer {
    constructor() {
        this.dependencies = {};
        this.setupDependencies();
    }

    setupDependencies() {
        // Repository
        this.dependencies.valueRepository = new MsSqlValueRepository();
        
        // Use Cases
        this.dependencies.getAllValuesUseCase = new GetAllValuesUseCase(
            this.dependencies.valueRepository
        );
        this.dependencies.createValueUseCase = new CreateValueUseCase(
            this.dependencies.valueRepository
        );
        this.dependencies.deleteValueUseCase = new DeleteValueUseCase(
            this.dependencies.valueRepository
        );
        this.dependencies.getHealthUseCase = new GetHealthUseCase(
            this.dependencies.valueRepository
        );
        
        // Controller
        this.dependencies.valueController = new ValueController(
            this.dependencies.getAllValuesUseCase,
            this.dependencies.createValueUseCase,
            this.dependencies.deleteValueUseCase,
            this.dependencies.getHealthUseCase
        );
    }

    get(name) {
        if (!this.dependencies[name]) {
            throw new Error(`Dependency '${name}' not found`);
        }
        return this.dependencies[name];
    }

    async initializeDatabase(dbConfig) {
        const repository = this.get('valueRepository');
        await repository.initialize(dbConfig);
    }
}

module.exports = DIContainer;