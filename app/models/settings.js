let baseModel = require('./baseModel');

/**
 * Growth Plan Schema
 * @typedef {Object} settingsSchema
 * @property {Number} _id - Plan Id
 * @property {Number} userMysqlId: {type: Number, required: true},
 * @property {String} name: {type: String, required: true},
 * @property {Array|String} activities: ref: 'Activity'}],
 * @property {Date} createdAt: Date,
 * @property {Date} updatedAt: Date,
 * @property {Date} deletedAt: Date,
 */
let settingsSchema = new baseModel.Schema({
    userMysqlId: {type: Number, required: true},
	name: {type: String, required: true},
    value: {type: String, required: true},
    type: {type: String, enum: ['activities_filters'], default: 'activities_filters'},
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Settings = baseModel.model('Settings', settingsSchema);

module.exports = Settings;
