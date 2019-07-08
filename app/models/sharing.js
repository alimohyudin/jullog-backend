let baseModel = require('./baseModel');

let sharing = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    
    sharedFeature: {type: String, required: true},
    sharedFeatureId: {type: String, required: true},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Sharing = baseModel.model('Sharing', sharing);

module.exports = Sharing;
