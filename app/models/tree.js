let baseModel = require('./baseModel');

/**
 * Trees Schema
 * @typedef {Object} MethodSchema
 * @property {Number} _id - Tree Id
 * @property {String} areaId: {type: String, ref:'area'},
 * @property {Number} userMysqlId: {type: Number, required: true},
 * @property {String} assessment: {type: String, default: ''},
 * @property {String} whoDoAssessment: {type: String, default: ''},
 * @property {String} treeHeight: {type: String, default: ''},
 * @property {String} topLength: {type: String, default: ''},
 * @property {String} budsNextToTop: {type: String, default: ''},
 * @property {String} shotsLastNode: {type: String, default: ''},
 * @property {String} internodeBuds: {type: String, default: ''},
 * @property {String} branchesDistance: {type: String, default: ''},
 * @property {String} treeBottomWidth: {type: String, default: ''},
 * @property {String} typeOfDensity: {type: String, default: ''},
 * @property {String} treeFormType: {type: String, default: ''},
 * @property {String} treeColor: {type: String, default: ''},
 * @property {String} shotShapeIssues: {type: String, default: ''},
 * @property {String} shotNeedleIssues: {type: String, default: ''},
 * @property {String} conditions: {type: String, default: ''},
 * @property {String} yourAssessment: {type: String, default: ''},
 * @property {Number} age: {type: Number, default: 0},
 * @property {Date} createdAt: Date,
 * @property {Date} updatedAt: Date,
 * @property {Date} deletedAt: Date,
 */
let TreeSchema = new baseModel.Schema({
	areaId: {type: String, ref:'area'},
	userMysqlId: {type: Number, required: true},
	assessment: {type: String, default: ''},
	whoDoAssessment: {type: String, default: ''},
	treeHeight: {type: String, default: ''},
	topLength: {type: String, default: ''},
	budsNextToTop: {type: String, default: ''},
	shotsLastNode: {type: String, default: ''},
	internodeBuds: {type: String, default: ''},
	branchesDistance: {type: String, default: ''},
	treeBottomWidth: {type: String, default: ''},
	typeOfDensity: {type: String, default: ''},
	treeFormType: {type: String, default: ''},
	treeColor: {type: String, default: ''},
	shotShapeIssues: {type: String, default: ''},
	shotNeedleIssues: {type: String, default: ''},
	conditions: {type: String, default: ''},
	yourAssessment: {type: String, default: ''},
	age: {type: Number, default: 0},
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
});

let Tree = baseModel.model('Tree', TreeSchema);

module.exports = Tree;
