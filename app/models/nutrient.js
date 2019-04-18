let baseModel = require('./baseModel');
/**
 * Nutrient Schema
 * @typedef {Object} NutrientSchema
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
let nutrientSchema = new baseModel.Schema({
	areaId: {type: String, ref:'area'},
	userMysqlId: {type: Number, required: true},
	userMysqlType: { type: String, required: true, default: 'customer'},
	usedOnDate: { type: Date},
	type: { type: String, required: true},
    
	nitrogen:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	phosphorus:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	potassium:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	calcium:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	magnesium:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	sodium:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	sulfur:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	boron:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	chlorine:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	copper:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	iron:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	manganese:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
	molybdenum:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
  zinc:{
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},

  reaction: {
		min: {type: Number, default: null},
		max: {type: Number, default: null},
		value: {type: Number, default: null}
	},
    
	createdAt: Date,
	updatedAt: Date,
	deletedAt: Date,
});

let Nutrient = baseModel.model('Nutrient', nutrientSchema);

module.exports = Nutrient;
