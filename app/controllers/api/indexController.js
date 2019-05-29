let mongoose = require('mongoose'),
Factory = require('../../util/factory');

module.exports = class IndexController {

    constructor() {
    }

    update302To303(req, res){
        Factory.models.area.find({})
        .exec(async(err, areas)=>{
            if(err){
                console.log(err);
            }
            areas.forEach((area, index, list) =>{
                areas[index].activities = []
                areas[index].areaType = 'christmasTreesAbiesNordmanniana'
                areas[index].save();
            });
            /* await Factory.models.activity.find({})
            .exec(async(err, activities)=>{
                if(err){
                    console.log(err);
                }
                activities.forEach((activity, index, list) =>{
                    activities[index].areaType = 'christmas'
                    activities[index].save();
                });
            }) */
            return res.send(Factory.helpers.prepareResponse({
                success: true,
                message: "areas updated",
            }));
        })

    }

    /* FOR: calculate current tree numbers from activities */
    calculateTrees(req, res){
        Factory.helpers.calculateAllCurrentTreeNumbers();
        
    }
    /*  */

    /* start: made for exporter  */
    
    recalculateAge(req, res){
        Factory.models.area.find({})
        .populate('trees')
        .exec(async(err, areas)=>{
            if(err){
                console.log(err);
            }

            console.log("areas found");
            areas.forEach((el, index, list) =>{
                //console.log(el.yearOfEstablishment);
                el.trees.forEach((tree, i2, list2)=>{
                    if(el.yearOfEstablishment){
                        let diff = tree.createdAt.getFullYear() - el.yearOfEstablishment;
                        //let newDate = new Date(diff);
                        console.log("Age of "+tree.createdAt.getFullYear() +"-"+ el.yearOfEstablishment +" = "+diff);

                        areas[index].trees[i2].age = diff;
                        areas[index].trees[i2].save();
                    }
                })
                //console.log(el.trees.length);
            })
            
            return res.send(Factory.helpers.prepareResponse({
                success: true,
                message: "areas found",
            }));

        })
    }

    createArea(req, res){
        return;
        //console.log(req.body);
        req.checkBody('areaName', 'areaName is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            var area = {
                areaMysqlId: req.body.areaMysqlId,
                userMysqlId: req.body.userMysqlId,

                areaName: req.body.areaName,
                postCode: (req.body.postCode) ? req.body.postCode: '',
                yearOfEstablishment: (req.body.yearOfEstablishment) ? req.body.yearOfEstablishment: '',
                constructionMonth: (req.body.constructionMonth) ? req.body.constructionMonth: '',
                areaSize: (req.body.areaSize) ? req.body.areaSize: '',
                previousAgriculture: (req.body.previousAgriculture) ? req.body.previousAgriculture: '',
                previousChristmasTreesTurns: (req.body.previousChristmasTreesTurns) ? req.body.previousChristmasTreesTurns: '',
                plantMethod: (req.body.plantMethod) ? req.body.plantMethod: '',
 
                numberOfTrees: (req.body.numberOfTrees) ? req.body.numberOfTrees: '',
                growAge: (req.body.growAge) ? req.body.growAge: '',
                productionTruns: (req.body.productionTruns) ? req.body.productionTruns: '',
    
                treeSize: (req.body.treeSize) ? req.body.treeSize: '',
                woodForm: (req.body.woodForm) ? req.body.woodForm: '',
                treeType: (req.body.treeType) ? req.body.treeType: '',
                operatingMode: (req.body.operatingMode) ? req.body.operatingMode: '',
                plantNumber: (req.body.plantNumber) ? req.body.plantNumber: '',
                provenance: (req.body.provenance) ? req.body.provenance: '',
                planteafstand: (req.body.planteafstand) ? req.body.planteafstand: '',
                raekkeafstand: (req.body.raekkeafstand) ? req.body.raekkeafstand: '',
                plantPattern: (req.body.plantPattern) ? req.body.plantPattern: '',
                trackWidth: (req.body.trackWidth) ? req.body.trackWidth: '',
                rowsBetweenTracks: (req.body.rowsBetweenTracks) ? req.body.rowsBetweenTracks: '',
                
                soilType: (req.body.soilType) ? req.body.soilType: '',
                terrainTopo: (req.body.terrainTopo) ? req.body.terrainTopo: '',
                terrainSlope: (req.body.terrainSlope) ? req.body.terrainSlope: '',
                windExposure: (req.body.windExposure) ? req.body.windExposure: '',
                
                fence: (req.body.fence) ? req.body.fence : '',
	            notes: (req.body.notes) ? req.body.notes : '',

                //trees information; form 49
                trees:[],

                activities:[],



                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }
            // save
            Factory.models.area(area).save(async(err, newArea) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating area functionality.')
                    }))
                }
                else{
                    res.send(Factory.helpers.prepareResponse({
                        message: 'Area Created!',
                        data: newArea,
                    }));
                }
            })
        })
    }

    deleteMysqlAreasTrees(req, res){
        Factory.models.area.find({areaMysqlId: {$ne: null}})
        .exec(async(err, areas)=>{
            if(err){
                console.log("error occured");
                return console.log(err);
            }
            for (let i = 0; i < areas.length; i++) {
                const element = areas[i];
                console.log(element.trees);
                //delete these trees
                for (let j = 0; j < element.trees.length; j++) {
                    const tree = element.trees[j];
                    console.log("each, ");
                    let treeFetched = await Factory.models.tree.findOne({_id: tree}).exec();

                    if(!treeFetched.age){
                        await Factory.models.tree.findOneAndRemove({_id: tree}).exec();
                        areas[i].trees.splice(j, 1);
                    }
                }
                areas[i].save();
            }
            //areas.save();
        })
    }
    
    createTree(req, res){
        //return;
        //req.checkBody('areaMysqlId', 'areaMysqlId is required').required();
        let where = {};
        console.log(req.body.userMysqlId);
        req.checkBody('userMysqlId', 'userMysqlId is required').required();

        if(!req.body.areaId){
            console.log(req.body.areaMysqlId);
            req.checkBody('areaMysqlId', 'areaMysqlId is required').required();
            where = {areaMysqlId: req.body.areaMysqlId};
        }
        else{
            req.checkBody('areaId', 'areaId is required').required();
            where = {_id: req.body.areaId}
        }
        
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            
            console.log(req.body.shotShapeIssues);
            console.log(req.body.shotNeedleIssues);

            let shotShapeIssues = '';
            let shotNeedleIssues = '';
            if(req.body.shotShapeIssues){
                for (let i = 0; i < 20; i++) {
                    const element = req.body.shotShapeIssues.split(',')[i];
                    if(element !== undefined)
                    {
                        if(shotShapeIssues != '')
                            shotShapeIssues += ',';
                        shotShapeIssues += element.split(':')[1];
                    }
                    else if(shotShapeIssues == '' && req.body.shotShapeIssues != ''){
                        shotShapeIssues = req.body.shotShapeIssues.split(':')[1];
                    }
                    else
                        break;
                }
            }

            if(req.body.shotNeedleIssues){
                for (let i = 0; i < 20; i++) {
                    const element = req.body.shotNeedleIssues.split(',')[i];
                    
                    if(element !== undefined)
                    {
                        if(shotNeedleIssues != '')
                            shotNeedleIssues += ',';
                        ////console.log(element);
                        shotNeedleIssues += element.split(':')[1];
                    }
                    else if(shotNeedleIssues == '' && req.body.shotNeedleIssues != ''){
                        shotNeedleIssues = req.body.shotNeedleIssues.split(':')[1];
                    }
                    else
                        break;
                }
            }
            

            console.log(shotNeedleIssues);
            console.log(shotShapeIssues);
            console.log("");

            
            /* res.send(Factory.helpers.prepareResponse({
                message: 'Tree Created!',
                data: {},
            })); */
            Factory.models.area.findOne(where)
            .exec(async(err, area) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Area not found.')
                    }))
                }

                let today = (req.body.createdAt) ? new Date(req.body.createdAt): new Date();
                let treeAge = '';
                //console.log("Age of "+today.getFullYear() +"-"+ area.yearOfEstablishment +" = ");
                if(area.yearOfEstablishment)
                    treeAge = today.getFullYear() - area.yearOfEstablishment;

                console.log("AGE: "+treeAge);

                var tree = {
                    areaId: area._id,
                    userMysqlId: req.body.userMysqlId,
    
                    assessment: (req.body.assessment) ? req.body.assessment : '' ,
                    whoDoAssessment: (req.body.whoDoAssessment) ? req.body.whoDoAssessment : '' ,
                    treeHeight: (req.body.treeHeight) ? req.body.treeHeight : '' ,
                    topLength: (req.body.topLength) ? req.body.topLength : '' ,
                    budsNextToTop: (req.body.budsNextToTop) ? req.body.budsNextToTop : '' ,
                    shotsLastNode: (req.body.shotsLastNode) ? req.body.shotsLastNode : '' ,
                    internodeBuds: (req.body.internodeBuds) ? req.body.internodeBuds : '' ,
                    branchesDistance: (req.body.branchesDistance) ? req.body.branchesDistance : '' ,
                    treeBottomWidth: (req.body.treeBottomWidth) ? req.body.treeBottomWidth : '' ,
                    typeOfDensity: (req.body.typeOfDensity) ? req.body.typeOfDensity : '' ,
                    treeFormType: (req.body.treeFormType) ? req.body.treeFormType : '' ,
                    treeColor: (req.body.treeColor) ? req.body.treeColor : '' ,
                    shotShapeIssues: shotShapeIssues,
                    shotNeedleIssues: shotNeedleIssues ,
                    conditions: (req.body.conditions) ? req.body.conditions : '' ,
                    yourAssessment: (req.body.yourAssessment) ? req.body.yourAssessment : '' ,

                    age: treeAge,

                    createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                    updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
                }
                //console.log(tree);
                // save
                Factory.models.tree(tree).save(async(err, newTree) => {
                    if(err){
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating tree functionality.')
                        }))
                    }
                    /* push tree to area */
                    Factory.models.area.findOneAndUpdate(
                        { _id: area._id },
                        { "$push": { "trees": newTree._id } }
                    ).exec(async(err, updatedArea)=>{
                        if(err){
                            console.log(err);
                        }
                    });

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Tree Created!'),
                        data: newTree,
                    }));

                    /* area.trees.push(newTree._id);
                    area.save(async(err, updatedArea) => {
                        if(err){
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('area inside tree is not updated.'),
                            }))
                        }

                        res.send(Factory.helpers.prepareResponse({
                            message: 'Tree Created!',
                            data: newTree,
                        }));
                    }) */
                })
            })
        })
    }

    /* start: made for exporter  */



    test(req, res){
        res.send(Factory.helpers.prepareResponse({
            message: req.__('testing...')
            })
        );
    }

    async settings(req, res) {
        let languages = await Factory.models.language.find({}, `_id title createdAt updatedAt`).lean(true),
        countries = await Factory.models.country.find({}, `_id translations createdAt updatedAt`).lean(true),
        bodyTypes = await Factory.models.bodyType.find({}, `_id translations createdAt updatedAt`).lean(true),
        skinColors = await Factory.models.skinColor.find({}, `_id translations createdAt updatedAt`).lean(true),
        orientations = await Factory.models.orientation.find({}, `_id translations createdAt updatedAt`).lean(true),
        maritalStatuses = await Factory.models.maritalStatus.find({}, `_id translations createdAt updatedAt`).lean(true),
        purposes = await Factory.models.purpose.find({}, `_id translations createdAt updatedAt`).lean(true),
        religions = await Factory.models.religion.find({}, `_id translations createdAt updatedAt`).lean(true),
        ethnicities = await Factory.models.ethnicity.find({}, `_id translations createdAt updatedAt`).lean(true),
        nationalities = await Factory.models.nationality.find({}, `_id translations createdAt updatedAt`).lean(true),
        interests = await Factory.models.interest.find({}, `_id translations createdAt updatedAt`).lean(true);
        religions = await Factory.models.religion.find({}, `_id translations createdAt updatedAt`).lean(true);
        
        res.send(Factory.helpers.prepareResponse({
            message: req.__('settings'),
            data: {
                languages: languages,
                countries: countries,
                bodyTypes: bodyTypes,
                skinColors: skinColors,
                orientations: orientations,
                maritalStatuses: maritalStatuses,
                purposes: purposes,
                ethnicities: ethnicities,
                nationalities: nationalities,
                interests: interests,
                religions: religions,
            }
        }));
    }

    async configurations(req, res) {
        let languages = await Factory.models.language.find({}, `_id title createdAt updatedAt`).lean(true),
        countries = await Factory.models.country.find({}, `_id translations createdAt updatedAt`).lean(true),
        bodyTypes = await Factory.models.bodyType.find({}, `_id translations createdAt updatedAt`).lean(true),
        skinColors = await Factory.models.skinColor.find({}, `_id translations createdAt updatedAt`).lean(true),
        orientations = await Factory.models.orientation.find({}, `_id translations createdAt updatedAt`).lean(true),
        maritalStatuses = await Factory.models.maritalStatus.find({}, `_id translations createdAt updatedAt`).lean(true),
        purposes = await Factory.models.purpose.find({}, `_id translations createdAt updatedAt`).lean(true),
        religions = await Factory.models.religion.find({}, `_id translations createdAt updatedAt`).lean(true),
        ethnicities = await Factory.models.ethnicity.find({}, `_id translations createdAt updatedAt`).lean(true),
        nationalities = await Factory.models.nationality.find({}, `_id translations createdAt updatedAt`).lean(true),
        interests = await Factory.models.interest.find({}, `_id translations createdAt updatedAt`).lean(true);
        religions = await Factory.models.religion.find({}, `_id translations createdAt updatedAt`).lean(true);
        
        res.send(Factory.helpers.prepareResponse({
            message: req.__('settings'),
            data: {
                languages: languages,
                countries: await Factory.helpers.getTranslatedCollection(countries, req.query.language),
                bodyTypes: await Factory.helpers.getTranslatedCollection(bodyTypes, req.query.language),
                skinColors: await Factory.helpers.getTranslatedCollection(skinColors, req.query.language),
                orientations: await Factory.helpers.getTranslatedCollection(orientations, req.query.language),
                maritalStatuses: await Factory.helpers.getTranslatedCollection(maritalStatuses, req.query.language),
                purposes: await Factory.helpers.getTranslatedCollection(purposes, req.query.language),
                ethnicities: await Factory.helpers.getTranslatedCollection(ethnicities, req.query.language),
                nationalities: await Factory.helpers.getTranslatedCollection(nationalities, req.query.language),
                interests: await Factory.helpers.getTranslatedCollection(interests, req.query.language),
                religions: await Factory.helpers.getTranslatedCollection(religions, req.query.language),
            }
        }));
    }

    cities(req, res) {
        req.checkBody('country', 'Please select a country').required().isObjectId().withMessage('Invalid country');
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                Factory.models.city.find({
                    country: req.body.country, 
                }, `_id translations createdAt updatedAt`)
                .lean(true)
                .exec((err, cities) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Cities'),
                            data: cities
                        }));
                    }
                });
            }
        });
    }

    countryCities(req, res) {
        req.checkBody('country', 'Please select a country').required().isObjectId().withMessage('Invalid country');
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                Factory.models.city.find({
                    country: req.body.country, 
                }, `_id translations createdAt updatedAt`)
                .lean(true)
                .exec(async(err, cities) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Cities'),
                            data: await Factory.helpers.getTranslatedCollection(cities, req.body.language)
                        }));
                    }
                });
            }
        });
    }

    neighbourhoods(req, res) {
        req.checkBody('city', 'Please select a city').required().isObjectId().withMessage('Invalid city');
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                Factory.models.neighbourhood.find({
                    city: req.body.city, 
                }, `_id translations createdAt updatedAt`)
                .lean(true)
                .exec((err, neighbourhoods) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Neighbourhoods'),
                            data: neighbourhoods
                        }));
                    }
                });
            }
        });
    }

    cityNeighbourhoods(req, res) {
        req.checkBody('city', 'Please select a city').required().isObjectId().withMessage('Invalid city');
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                Factory.models.neighbourhood.find({
                    city: req.body.city, 
                }, `_id translations createdAt updatedAt`)
                .lean(true)
                .exec(async(err, neighbourhoods) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Neighbourhoods'),
                            data: await Factory.helpers.getTranslatedCollection(neighbourhoods, req.body.language)
                        }));
                    }
                });
            }
        });
    }

    subscribe(req, res) {
        req.checkBody('email', 'The email field is required').required().isEmail().withMessage('The email is invalid');
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let count = await Factory.models.subscriber.where({email: req.body.email}).count();
                if (count <= 0) {
                    Factory.models.subscriber({email: req.body.email}).save((err, subscriber) => {
                        if (err) {
                            //console.log(err);
                        }
                    });
                }
                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Thank you for subscription')
                }));
            }
        });
    }
}
