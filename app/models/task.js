let baseModel = require('./baseModel');

let task = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
    staffId: {type: String, ref: 'staffId'},
    
    taskCategory: {type: String, enum: ['area', 'plan', 'template'], default: 'area'},
    areaId: {type: String, ref: 'area'},
    activityType: { type: String, default: ''},
    activityId: {type: String, ref:'activity'},

    dateCompleted: {type: Date, default: ''},
    dateCompletedTimeZoneOffest: {type: Number, default: 0},
    
    meanQuantity: [{ type: Number, default: 0}],
    otherQuantity: { type: Number, default: 0},

    notes:{type: String, default: ''},

    meanMapping: [{type:String, ref: 'Inventory'}],
    deductQuantityFrom: {type: String, enum: ['no-deduct', 'staff-deduct', 'owner-deduct'], default: 'no-deduct'},
    isQuantityDeducted: {type: Boolean, default: false},
    
    meanJournalReported: [{ type: Boolean, default: false}],

    status: { type: String, enum:['not-started', 'in-progress', 'completed', 'canceled', 'accepted', 'rejected'], default: 'not-started'},
    hoursSpent: { type: Number, default: 0},
    
    weatherCondition: { type: String, default: ''},
	wind: { type: String, default: ''},
	temperature: { type: String, default: ''},
	weather: { type: String, default: ''},

    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    deletedAt: Date,
});

let Task = baseModel.model('Task', task);

module.exports = Task;
