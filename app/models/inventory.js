let baseModel = require('./baseModel');

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

	//Nutrients for Fertilizers
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

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
});

let Inventory = baseModel.model('Inventory', inventorySchema);

module.exports = Inventory;
