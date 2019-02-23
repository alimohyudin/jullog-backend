let baseModel = require('./baseModel');

/**
 * Growth Plan Schema
 * @typedef {Object} GrowthPlanSchema
 * @property {Number} _id - Plan Id
 * @property {Number} userMysqlId: {type: Number, required: true},
 * @property {String} name: {type: String, required: true},
 * @property {Array|String} activities: ref: 'Activity'}],
 * @property {Date} createdAt: Date,
 * @property {Date} updatedAt: Date,
 * @property {Date} deletedAt: Date,
 */
let growthPlanSchema = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
	name: {type: String, required: true},
	activities: [{type: String, ref: 'Activity'}],
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let GrowthPlan = baseModel.model('GrowthPlan', growthPlanSchema);

module.exports = GrowthPlan;
