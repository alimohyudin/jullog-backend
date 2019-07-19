let baseModel = require('./baseModel');

let task = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    staffId: {type: String, ref: 'staffId'},
    
    taskCategory: {type: String, enum: ['area', 'plan', 'template'], default: 'area'},
    activityId: {type: String, ref:'activity'},

    dateCompleted: {type: Date, default: ''},
    dateCompletedTimeZoneOffest: {type: Number, default: 0},
    
    meanQuantity: [{ type: Number, default: 0}],
    notes:{type: String, default: ''},

    status: { type: String, enum:['not-started', 'in-progress', 'finished', 'canceled', 'accepted', 'rejected'], default: 'not-started'},
    hoursSpent: { type: Number, default: 0},
    startTime: { type: Date, default: ''},
    endTime: { type: Date, default: ''},
    //or
    timeSpans: [{
        startTime: Date,
        endTime: Date,
        notes: {type: String, default: ''}
    }],

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Task = baseModel.model('Task', task);

module.exports = Task;
