let baseModel = require('./baseModel');

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
