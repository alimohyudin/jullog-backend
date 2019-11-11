let baseModel = require('./baseModel');

let areaProperty = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    
    name: {type: String, required: true},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let AreaProperty = baseModel.model('AreaProperty', areaProperty);

module.exports = AreaProperty;
