let baseModel = require('./baseModel');

let staff = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    ownerName: {type: String, required: true},
    
    staffMysqlId: {type: Number, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},

    request: {type: String, enum: ['request-sent','accepted', 'rejected', 'blocked'], default: 'request-sent'},

    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    deletedAt: Date,
});

let Staff = baseModel.model('Staff', staff);

module.exports = Staff;
