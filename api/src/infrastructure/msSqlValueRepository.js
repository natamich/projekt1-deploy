// Infrastructure - Database Implementation
const sql = require('mssql');
const ValueRepository = require('../domain/valueRepository');
const Value = require('../domain/value');

class MsSqlValueRepository extends ValueRepository {
    constructor() {
        super();
        this.dbConnected = false;
        this.tableReady = false;
        this.mockData = [
            new Value(1, 'Demo Item 1', 'Demo Value 1'),
            new Value(2, 'Demo Item 2', 'Demo Value 2'),
            new Value(3, 'Demo Item 3', 'Demo Value 3')
        ];
        this.nextMockId = 4;
    }

    async initialize(dbConfig) {
        try {
            await sql.connect(dbConfig);
            console.log('Connected to SQL Server database');
            this.dbConnected = true;
            
            // Ensure table exists
            await this.ensureTableExists();
        } catch (err) {
            console.error('Database connection error:', err);
            this.dbConnected = false;
        }
    }

    async ensureTableExists() {
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
            
            this.tableReady = true;
            console.log('TestTable is ready');
        } catch (err) {
            console.error('Error ensuring table exists:', err);
            this.tableReady = false;
        }
    }

    async findAll() {
        if (!this.dbConnected || !this.tableReady) {
            console.log('Database/table not ready, returning mock data');
            return this.mockData;
        }

        try {
            const request = new sql.Request();
            const result = await request.query('SELECT * FROM TestTable ORDER BY ID');
            
            return result.recordset.map(row => Value.fromDatabase(row));
        } catch (err) {
            console.error('Error getting values:', err);
            console.log('Database error, returning mock data');
            return this.mockData;
        }
    }

    async findById(id) {
        if (!this.dbConnected || !this.tableReady) {
            return this.mockData.find(item => item.id == id) || null;
        }

        try {
            const request = new sql.Request();
            request.input('id', sql.Int, id);
            
            let result;
            try {
                result = await request.query('SELECT * FROM TestTable WHERE ID = @id');
            } catch (firstErr) {
                result = await request.query('SELECT * FROM TestTable WHERE id = @id');
            }
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return Value.fromDatabase(result.recordset[0]);
        } catch (err) {
            console.error('Error finding value:', err);
            return this.mockData.find(item => item.id == id) || null;
        }
    }

    async create(value) {
        if (!this.dbConnected || !this.tableReady) {
            const newId = this.nextMockId++;
            const newValue = new Value(newId, value.name, value.value);
            this.mockData.push(newValue);
            console.log('Database/table not ready, added to mock data:', newValue);
            return newValue;
        }

        try {
            const request = new sql.Request();
            request.input('name', sql.NVarChar, value.name);
            request.input('value', sql.NVarChar, value.value);
            
            let result;
            try {
                result = await request.query('INSERT INTO TestTable (Name, Value) VALUES (@name, @value); SELECT SCOPE_IDENTITY() as ID');
            } catch (firstErr) {
                console.log('Trying lowercase field names...');
                result = await request.query('INSERT INTO TestTable (name, value) VALUES (@name, @value); SELECT SCOPE_IDENTITY() as id');
            }
            
            const insertedId = result.recordset[0].ID || result.recordset[0].id;
            return new Value(insertedId, value.name, value.value);
        } catch (err) {
            console.error('Error creating value:', err);
            // Mock fallback on error
            const newId = Math.max(...this.mockData.map(item => item.id)) + 1;
            const newValue = new Value(newId, value.name, value.value);
            return newValue;
        }
    }

    async update(id, value) {
        if (!this.dbConnected || !this.tableReady) {
            const index = this.mockData.findIndex(item => item.id == id);
            if (index !== -1) {
                this.mockData[index].name = value.name;
                this.mockData[index].value = value.value;
                return this.mockData[index];
            }
            throw new Error('Value not found');
        }

        try {
            const request = new sql.Request();
            request.input('id', sql.Int, id);
            request.input('name', sql.NVarChar, value.name);
            request.input('value', sql.NVarChar, value.value);
            
            let result;
            try {
                result = await request.query('UPDATE TestTable SET Name = @name, Value = @value WHERE ID = @id');
            } catch (firstErr) {
                result = await request.query('UPDATE TestTable SET name = @name, value = @value WHERE id = @id');
            }
            
            return new Value(id, value.name, value.value);
        } catch (err) {
            console.error('Error updating value:', err);
            throw err;
        }
    }

    async delete(id) {
        if (!this.dbConnected || !this.tableReady) {
            const index = this.mockData.findIndex(item => item.id == id);
            if (index !== -1) {
                const removedItem = this.mockData.splice(index, 1)[0];
                console.log('Database/table not ready, removed from mock data:', removedItem);
                return;
            }
            throw new Error('Value not found');
        }

        try {
            const request = new sql.Request();
            request.input('id', sql.Int, id);
            
            let result;
            try {
                result = await request.query('DELETE FROM TestTable WHERE ID = @id');
            } catch (firstErr) {
                console.log('Trying lowercase field name for delete...');
                result = await request.query('DELETE FROM TestTable WHERE id = @id');
            }
        } catch (err) {
            console.error('Error deleting value:', err);
            throw err;
        }
    }

    async healthCheck() {
        return {
            connected: this.dbConnected,
            tableReady: this.tableReady
        };
    }
}

module.exports = MsSqlValueRepository;