var mongoose = require('mongoose');

module.exports = {
    Schema: mongoose.Schema,
    model: (modelName, schemaObject) => {
        return mongoose.model(modelName, schemaObject);
    }
};