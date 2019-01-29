let baseModel = require('./baseModel');

let treeNumberTimeSeriesSchema = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    
    areaId: {type: String, ref: 'Area'},
    activityId: {type: String, ref: 'Activity'},
    
    numberOfTrees: {type: Number, default: 0},
    percentageOfTrees: {type: Number, default: 0},

    sellingPricePerUnit: {type: Number, default: 0},
    averageHeight: {type: Number, default: 0},

    note: {type: String, default: ''},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let TreeNumberTimeSeries = baseModel.model('TreeNumberTimeSeries', treeNumberTimeSeriesSchema);

module.exports = TreeNumberTimeSeries;
