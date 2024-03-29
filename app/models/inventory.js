let baseModel = require('./baseModel');
/**
 * Inventory or Mean Schema
 * @typedef {Object} InventorySchema
 * @property {Number} _id - Inventory/Mean Id
 * @property {Number} userMysqlId: {type: Number, required: true},
 * @property {String} userMysqlType: { type: String, required: true, default: 'customer'},
 * @property {String} name: { type: String, required: true},
 * @property {String} type: { type: String, required: true},
 * @property {String} registrationNumber: { type: String, default: ''},
 * @property {Number} quantity: {type: Number, default: 0},
 * @property {String} unit: {type: String, default: ''},
 * @property {Number} unitPrice: {type: Number, default: 0},
 * @property {String} treatmentUnit: {type: String, default: ''},
 * @property {String} supplier: {type: String},
 * @property {String} productLink: {type: String},
 * @property {String} activeAgent:{type: String},
 * @property {Number} nitrogen:{type: Number},
 * @property {Number} phosphorus:{type: Number},
 * @property {Number} potassium:{type: Number},
 * @property {Number} calcium:{type: Number},
 * @property {Number} magnesium:{type: Number},
 * @property {Number} sodium:{type: Number},
 * @property {Number} sulfur:{type: Number},
 * @property {Number} boron:{type: Number},
 * @property {Number} chlorine:{type: Number},
 * @property {Number} copper:{type: Number},
 * @property {Number} iron:{type: Number},
 * @property {Number} manganese:{type: Number},
 * @property {Number} molybdenum:{type: Number},
 * @property {Number} zinc:{type: Number},
 * @property {Number} createdAt: Date,
 * @property {Number} updatedAt: Date,
 * @property {Number} deletedAt: Date,
 */
let inventorySchema = new baseModel.Schema({

	userMysqlId: {type: Number, required: true},
	userMysqlType: { type: String, required: true, default: 'customer'},
	name: { type: String, required: true},
	type: { type: String, required: true},
	registrationNumber: { type: String, default: ''},
	quantity: {type: Number, default: 0},
	unit: {type: String, default: ''},
	unitPrice: {type: Number, default: 0},
	treatmentUnit: {type: String, default: ''},
	supplier: {type: String},
	productLink: {type: String},
	activeAgent:{type: String},
	nitrogen:{type: Number},
	phosphorus:{type: Number},
	potassium:{type: Number},
	calcium:{type: Number},
	magnesium:{type: Number},
	sodium:{type: Number},
	sulfur:{type: Number},
	boron:{type: Number},
	chlorine:{type: Number},
	copper:{type: Number},
	iron:{type: Number},
	manganese:{type: Number},
	molybdenum:{type: Number},
	zinc:{type: Number},

	density: {type: Number, default: 0},

	createdAt: Date,
	updatedAt: Date,
	deletedAt: Date,
});

let Inventory = baseModel.model('Inventory', inventorySchema);

module.exports = Inventory;
