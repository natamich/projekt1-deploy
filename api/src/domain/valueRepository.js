// Repository Interface - Defines contract for data access
class ValueRepository {
    async findAll() {
        throw new Error('findAll method must be implemented');
    }

    async findById(id) {
        throw new Error('findById method must be implemented');
    }

    async create(value) {
        throw new Error('create method must be implemented');
    }

    async update(id, value) {
        throw new Error('update method must be implemented');
    }

    async delete(id) {
        throw new Error('delete method must be implemented');
    }

    async healthCheck() {
        throw new Error('healthCheck method must be implemented');
    }
}

module.exports = ValueRepository;