// Controllers - Interface Layer
class ValueController {
    constructor(getAllValuesUseCase, createValueUseCase, deleteValueUseCase, getHealthUseCase) {
        this.getAllValuesUseCase = getAllValuesUseCase;
        this.createValueUseCase = createValueUseCase;
        this.deleteValueUseCase = deleteValueUseCase;
        this.getHealthUseCase = getHealthUseCase;
    }

    async getAll(req, res) {
        try {
            const result = await this.getAllValuesUseCase.execute();
            
            if (result.success) {
                res.json(result.data);
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async create(req, res) {
        try {
            const { name, value } = req.body;
            
            if (!name || !value) {
                return res.status(400).json({ error: 'Name and Value are required' });
            }

            const result = await this.createValueUseCase.execute(name, value);
            
            if (result.success) {
                res.json({
                    success: true,
                    ID: result.data.ID,
                    message: result.message
                });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await this.deleteValueUseCase.execute(id);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async health(req, res) {
        try {
            const result = await this.getHealthUseCase.execute();
            
            if (result.success) {
                res.json(result.data);
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = ValueController;