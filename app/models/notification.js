let baseModel = require('./baseModel');

let notification = new baseModel.Schema({

    fromUserMysqlId: {type: Number, required: true},
    toUserMysqlId: {type: Number, required: true},
    
    title: {type: String, default: ''},
    detail: {type: String, default: ''},

    featureName: {type: String, default: ''},
    featureId: {type: String, default: ''},
    
    status: {type: String, enum: ['not-seen','seen', 'ignore'], default: 'not-seen'},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Notification = baseModel.model('Notification', notification);

module.exports = Notification;
