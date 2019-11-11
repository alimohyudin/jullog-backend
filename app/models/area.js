let baseModel = require('./baseModel');

/**
 * Area Schema
 * @typedef {Object} AreaSchema
 * @property {Number} _id - Area Id
 * @property {Number} areaMysqlId -
 * @property {Number} userMysqlId -
 * @property {String} areaName -
 * @property {String} postCode -
 * @property {String} roadAndNumber -
 * @property {String} yearOfEstablishment -
 * @property {String} constructionMonth -
 * @property {String} areaSize -
 * @property {String} previousAgriculture -
 * @property {String} previousChristmasTreesTurns -
 * @property {String} plantMethod -
 * @property {Number} numberOfTrees -
 * @property {Number} currentNumberOfTrees -
 * @property {String} organicProduction -
 * @property {Number} growAge -
 * @property {Number} productionTruns -
 * @property {String} farmFieldId -
 * @property {String} treeSize -
 * @property {String} woodForm -
 * @property {String} treeType -
 * @property {String} operatingMode -
 * @property {String} plantNumber -
 * @property {Number} plantsize -
 * @property {String} plantAge -
 * @property {String} provenance -
 * @property {String} provenanceCustom -
 * @property {String} planteafstand -
 * @property {String} raekkeafstand -
 * @property {String} plantPattern -
 * @property {String} trackWidth -
 * @property {String} rowsBetweenTracks -
 * @property {String} soilType -
 * @property {String} terrainTopo -
 * @property {String} terrainSlope -
 * @property {String} windExposure -
 * @property {String} fence -
 * @property {String} notes -
 * @property {String} trees -
 * @property {String} activities -
 * @property {String} areaImages 
 * @property {String} mapLink -
 * @property {Number} latitude -
 * @property {Number} longitude -
 * @property {String} openlayerMapFeatures -
 */

let areaSchema = new baseModel.Schema({
    areaMysqlId: Number,
	userMysqlId: {type: Number, required: true},

	areaName: {type: String, required: true},
	areaType: {type: String, required: true},
	postCode: {type: String, default: ''},
	roadAndNumber: {type: String, default: ''},
    yearOfEstablishment: {type: String, default: ''},
	constructionMonth: {type: String, default: ''},
	areaSize: {type: String, default: ''},
	previousAgriculture: {type: String, default: ''},
	previousChristmasTreesTurns: {type: String, default: ''},
	plantMethod: {type: String, default: ''},

	numberOfTrees: {type: Number, default: 0},
	currentNumberOfTrees: {type: Number, default:0},
	
	organicProduction: {type: String, default: ''},
	growAge: {type: Number, default: 0},
	productionTruns: {type: Number, default: 0},

	//What type of tree do you primarily go after producing in this piece?
	farmFieldId: {type: String, default: ''},
	treeSize: {type: String, default: ''},
	woodForm: {type: String, default: ''},
	treeType: {type: String, default: ''},
	operatingMode: {type: String, default: ''},
	plantNumber: {type: String, default: ''},
	plantsize: {type: Number, default: 0},
	plantAge: {type: String, default: ''},
	provenance: {type: String, default: ''},
	provenanceCustom: {type: String, default: ''},
	planteafstand: {type: String, default: ''},
	raekkeafstand: {type: String, default: ''},
	plantPattern: {type: String, default: ''},
	trackWidth: {type: String, default: ''},
    rowsBetweenTracks: {type: String, default: ''},
    
    soilType: {type: String, default: ''},
	terrainTopo: {type: String, default: ''},
	terrainSlope: {type: String, default: ''},
    windExposure: {type: String, default: ''},
    fence: {type: String, default: ''},
	notes: {type: String, default: ''},
	//trees information; form 49
    trees:[{type: String, ref: 'Tree'}],

    activities:[{type: String, ref: 'Activity'}],


	areaImages:[{type: String, default:''}],
	mapLink:{type: String, default: ''},
	latitude: {type: Number, default: 0},
	longitude: {type: Number, default: 0},
	openlayerMapFeatures: {type: String, default: ''},
	
	properties:[{type: String, ref: 'areaProperty'}],

    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    deletedAt: Date,
});

let Area = baseModel.model('Area', areaSchema);

module.exports = Area;
