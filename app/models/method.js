let baseModel = require('./baseModel');

let methodSchema = new baseModel.Schema({

	userMysqlId: {type: Number, required: true},
	userMysqlType: { type: String, required: true, default: 'customer'},

	name: { type: String, required: true},
	activityType: { type: String, required: true},
	
	methodUnit: { type: String, default: ''},
	unitsPerHour: { type: String, default: ''},
	unitPrice: { type: String, default: ''},
	notes: { type: String, default: ''},

    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Method = baseModel.model('Method', methodSchema);

module.exports = Method;
