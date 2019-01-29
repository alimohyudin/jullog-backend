let baseModel = require('./baseModel');

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
