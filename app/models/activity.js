let baseModel = require('./baseModel');
/**
 * Activity Schema for all sorts of Activities under Areas or Plans
 * @typedef {Object} ActivitySchema
 * @property {Number} _id - Activity Id
 * @property {number} userMysqlId - 
 * @property {string} areaId - 
 * @property {string} planId - 
 * @property {string} activityType - 
 * @property {string} scheduledMonth - 
 * @property {date} scheduledDate -
 * @property {date} dateCompleted -
 * @property {string} status -
 * @property {string} dose - 
 * @property {number} quantity - 
 * @property {number} unitPrice1 - 
 * @property {number} unitPrice2 - 
 * @property {number} totalCost - 
 * @property {string} performedBy - 
 * @property {string} contractor - 
 * @property {number} hoursSpent - 
 * @property {string} purpose - 
 * @property {string} reported - 
 * @property {string} notes - 
 * @property {string} weatherCondition -
 * @property {string} wind -
 * @property {string} temperature -
 * @property {string} weather -
 * @property {string} mean - {@link InventorySchema}
 * @property {string} method - {@link MethodSchema}
 * @property {number} ageYear -
 * @property {number} ageMonth -
 * @property {Boolean} [isQuantityDeducted] - 
 * @property {number} percentage -
 * @property {number} sellingPricePerUnit -
 * @property {Boolean} autoUpdate - 
 * @property {date} createdAt -
 * @property {date} updatedAt -
 * @property {date} deletedAt -
 */

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
