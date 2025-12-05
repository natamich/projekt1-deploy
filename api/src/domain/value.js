// Domain Entity - Value
class Value {
    constructor(id, name, value, createdAt = null) {
        this.id = id;
        this.name = name;
        this.value = value;
        this.createdAt = createdAt || new Date();
    }

    // Business rules and validations
    validate() {
        if (!this.name || this.name.trim() === '') {
            throw new Error('Name is required');
        }
        if (!this.value || this.value.trim() === '') {
            throw new Error('Value is required');
        }
        if (this.name.length > 100) {
            throw new Error('Name must be 100 characters or less');
        }
        if (this.value.length > 255) {
            throw new Error('Value must be 255 characters or less');
        }
    }

    // Factory method for creating from database row
    static fromDatabase(row) {
        return new Value(
            row.ID || row.id,
            row.Name || row.name,
            row.Value || row.value,
            row.created_at
        );
    }

    // Convert to database format
    toDatabase() {
        return {
            Name: this.name,
            Value: this.value
        };
    }

    // Convert to API response format
    toJSON() {
        return {
            ID: this.id,
            Name: this.name,
            Value: this.value,
            created_at: this.createdAt
        };
    }
}

module.exports = Value;