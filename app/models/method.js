let baseModel = require('./baseModel');

/**
 * Method Schema
 * @typedef {Object} MethodSchema
 * @property {Number} _id - Method Id
 * @property {Number} userMysqlId: {type: Number, required: true},
 * @property {String} userMysqlType: { type: String, required: true, default: 'customer'},
 * @property {String} name: { type: String, required: true},
 * @property {String} activityType: { type: String, required: true},
 * @property {String} methodUnit: { type: String, default: ''},
 * @property {String} unitsPerHour: { type: String, default: ''},
 * @property {String} unitPrice: { type: String, default: ''},
 * @property {String} notes: { type: String, default: ''},
 * @property {String} createdAt: Date,
 * @property {String} updatedAt: Date,
 * @property {String} deletedAt: Date,
 */
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
