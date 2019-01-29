let baseModel = require('./baseModel');

let activitySchema = new baseModel.Schema({

	userMysqlId: {type: Number, required: true},
	areaId: {type: String, ref:'area'},
	planId: {type: String, ref:'growthplan'},

	activityType: { type: String, default: ''},
	scheduledMonth: {type: String, default: ''},
	scheduledDate: {type: Date, default: ''},
	dateCompleted: {type: Date, default: ''},
	status:{type: String, default: 'Plan'},
	dose: { type: String, default: ''},
	quantity: { type: Number, default: ''},
	unitPrice1: { type: Number, default: ''},
	unitPrice2: { type: Number, default: ''},
	totalCost: { type: Number, default: ''},
	performedBy: { type: String, default: ''},
	contractor: { type: String, default: ''},
	hoursSpent: {type: Number, default: ''},
	purpose: { type: String, default: ''},
	reported: { type: String, default: ''},
	notes: { type: String, default: ''},

	weatherCondition: { type: String, default: ''},
	wind: { type: String, default: ''},
	temperature: { type: String, default: ''},
	weather: { type: String, default: ''},

	mean:{type:String, ref: 'Inventory'},
	method:{type:String, ref: 'Method'},
	
	ageYear: {type: Number, default: 0},
	ageMonth: {type: Number, default: 1},

	isQuantityDeducted: {type: Boolean, default: false},
	//percentageOfTrees: {type: Number, default: 0},
	percentage: {type: Number, default: 0},
	sellingPricePerUnit: {type: Number, default: 0},
	
	autoUpdate: {type: Boolean, default:true},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Activity = baseModel.model('Activity', activitySchema);

module.exports = Activity;
