let Factory = require('../../../util/factory');

class AreaHelper{
    constructor(){

    }

    /* create tree number time series helper */
    async createTreeTimeSeries(req, savedActivity){
        let timeSeries = {
            userMysqlId: req.USER_MYSQL_ID,

            areaId: savedActivity.areaId,
            activityId: savedActivity._id,
            
            numberOfTrees: (req.body.numberOfTrees) ? req.body.numberOfTrees: 0,
            percentageOfTrees: (req.body.percentageOfTrees) ? req.body.percentageOfTrees: 0,

            sellingPricePerUnit: (req.body.sellingPricePerUnit) ? req.body.sellingPricePerUnit: 0,
            averageHeight: (req.body.averageHeight) ? req.body.averageHeight: 0,

            note: (req.body.note) ? req.body.note: '',            

            createdAt: savedActivity.createdAt,
            updatedAt: savedActivity.updatedAt,
        }

        Factory.models.treeNumberTimeSeries(timeSeries).save(async(err, newTimeSeries)=>{
            if(err){
                console.log(err);
                return err;
            }

            return true;
        });
    }
    /* create tree time series helper */

    /* if fieldname=treebottomwidth update the graph using excel sheet form49 graphs */
    async treeHeightWidthRatio(match){
        let that = this;
        // two fields, treeHeight & treeBottomWidth
        let resultGraphData = [];
        let trees = await Factory.models.tree.find(match).select('treeHeight treeBottomWidth').exec();
        for(let index=0; index < trees.length; index++){
            let el = trees[index];

            if(el.treeHeight && el.treeHeight!='' && el.treeHeight!='Vælg' && el.treeBottomWidth && el.treeBottomWidth!='' && el.treeBottomWidth!='Vælg'){
                let avgTreeHeight = that.calculateAverage(el.treeHeight.split('-'));
                let avgTreeWidth = that.calculateSum(el.treeBottomWidth.split('-'));
                
                if(avgTreeHeight > 0){
                    let resultValue = avgTreeWidth / avgTreeHeight * 100; //0-200
                    if(resultValue < 30){
                        //resultGraphData['<30'] ;
                        if(resultGraphData['<30%'])
                            resultGraphData['<30%'] += 1;
                        else
                            resultGraphData['<30%'] = 1;
                    }
                    else if(resultValue > 130){
                        if(resultGraphData['130+'])
                            resultGraphData['130+'] +=1;
                        else
                            resultGraphData['130+'] = 1;
                    }
                    else if(resultValue > 0){
                        //resultGraphData['30-40'] =+1;
                        let lowerVal = resultValue - resultValue%10;
                        let upperVal = (resultValue - resultValue%10)+10;

                        if(resultGraphData[lowerVal+'-'+upperVal+'%'])
                            resultGraphData[lowerVal+'-'+upperVal+'%'] += 1;
                        else
                            resultGraphData[lowerVal+'-'+upperVal+'%'] = 1;
                    }
                    /* else{
                        console.log("NOT A NUMBER: ");
                        console.log(resultValue);
                        console.log(el.treeHeight);
                        console.log(el.treeBottomWidth);

                    } */

                }
            }
        };

        /* format like other graphs result from aggregation for proper calculation */
        let formatedResult = [];

        for (var k in resultGraphData){
            formatedResult.push({_id: k, count: resultGraphData[k]});
        }
        // console.log("formated result:");
        // console.log(formatedResult);
        return formatedResult;
        //let graphData = {'fieldName':'heightWidthRatio', 'graphName': 'Højde bredde forhold', 'defaultValues': ['<30%','30-40%','40-50%','50-60%','60-70%','70-80%','80-90%','90-100%','100-110%','110-120%','120-130%','130+']},
    }

    calculateAverage(vals){
        return (vals[0]*1+vals[1]*1)/2;
    }
    calculateSum(vals){
        return (vals[0]*1+vals[1]*1);
    }
    /* end */


    /**
     * Nutrients TimeSeries Graph helper
     */
    async nutrientsTimeSeriesGraphs(match){
        let outputData = [];
        let data = await Factory.models.activity.find(match, null, {sort: {'dateCompleted': 1}}).exec();
        let totalTrees = 0;
        //console.log(data);

        for (let i = 0; i < data.length; i++) {
            const thisActivity = data[i];
            /**
             * calculate trees
             */
            let dateCompleted = new Date(thisActivity.dateCompleted);
            let nowDate = new Date();
            if(thisActivity.dateCompleted && thisActivity.quantity && dateCompleted.getTime() <= nowDate.getTime()){
                
                if(thisActivity.activityType == 'planting')
                    totalTrees += thisActivity.quantity;
                else if(thisActivity.activityType == 'harvest' || thisActivity.activityType == 'scrap')
                    totalTrees -= thisActivity.quantity;
            }

            /**
             * Calculation
             */
            if(thisActivity.mean && thisActivity.mean != ''){
                let nutrientQuantity = thisActivity.quantity;
                let nutrient = await Factory.models.inventory.findOne({'_id': thisActivity.mean}).exec();
                let nutrientPercentage = nutrient.nitrogen ? nutrient.nitrogen : 0;

                let quantityNutrient = nutrientQuantity * nutrientPercentage;
                /* console.log("Details: ")
                console.log(nutrient)
                console.log(nutrientQuantity)
                console.log(nutrient.nitrogen)
                console.log(quantityNutrient)
                console.log(totalTrees) */
                let quantityNutrientPerTree = quantityNutrient / totalTrees;
                if(quantityNutrientPerTree >= 0){
                    outputData.push([
                        Date.UTC(dateCompleted.getFullYear(), dateCompleted.getMonth(), dateCompleted.getDate()), quantityNutrientPerTree   
                    ]);
                }
            }
        }
        return outputData;
    }

    converDanishMonthToNumber(danishMonth){
        let month = {
            'Vælg':-1,
            'januar':0,
            'februar':1,
            'marts':2,
            'april':3,
            'maj':4,
            'juni':5,
            'juli':6,
            'august':7,
            'september':8,
            'oktober':9,
            'november':10,
            'december':11
        };
        return month[danishMonth];
    }
}

module.exports = class AreasController {

    constructor() {
        
    }


    async createArea(req, res){

        let hasAreas = await Factory.models.area.find({userMysqlId: req.USER_MYSQL_ID}).select('_id').exec();
        console.log("CHECKING NUMBER OF AREAS!");
        console.log(hasAreas);
        console.log(req.ALLOWED_AREAS);

        if(hasAreas.length >= req.ALLOWED_AREAS){
            console.log("number of allowed areas checked and create operation is not allowed.");
            return res.send(Factory.helpers.prepareResponse({
                success: false,
                message: "You have reached your Area limits."
            }));
        }

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
                userMysqlId: req.USER_MYSQL_ID,

                areaName: req.body.areaName,
                postCode: (req.body.postCode) ? req.body.postCode: '',
                yearOfEstablishment: (req.body.yearOfEstablishment) ? req.body.yearOfEstablishment: '',
                constructionMonth: (req.body.constructionMonth) ? req.body.constructionMonth: '',
                areaSize: (req.body.areaSize) ? req.body.areaSize: '',
                previousAgriculture: (req.body.previousAgriculture) ? req.body.previousAgriculture: '',
                previousChristmasTreesTurns: (req.body.previousChristmasTreesTurns) ? req.body.previousChristmasTreesTurns: '',
                plantMethod: (req.body.plantMethod) ? req.body.plantMethod.toString(): '',
 
                numberOfTrees: (req.body.numberOfTrees) ? req.body.numberOfTrees: '',
                currentNumberOfTrees: (req.body.numberOfTrees) ? req.body.numberOfTrees: '',
                organicProduction: (req.body.organicProduction) ? req.body.organicProduction: '',
                growAge: (req.body.growAge) ? req.body.growAge: '',
                productionTruns: (req.body.productionTruns) ? req.body.productionTruns: '',
                
                farmFieldId: (req.body.farmFieldId) ? req.body.farmFieldId: '',
                treeSize: (req.body.treeSize) ? req.body.treeSize: '',
                woodForm: (req.body.woodForm) ? req.body.woodForm: '',
                treeType: (req.body.treeType) ? req.body.treeType: '',
                operatingMode: (req.body.operatingMode) ? req.body.operatingMode: '',
                plantNumber: (req.body.plantNumber) ? req.body.plantNumber: '',
                plantSize: (req.body.plantSize) ? req.body.plantSize: 0,
                plantAge: (req.body.plantAge) ? req.body.plantAge: '',
                provenance: (req.body.provenance) ? req.body.provenance: '',
                planteafstand: (req.body.planteafstand) ? req.body.planteafstand: '',
                raekkeafstand: (req.body.raekkeafstand) ? req.body.raekkeafstand: '',
                plantPattern: (req.body.plantPattern) ? req.body.plantPattern: '',
                trackWidth: (req.body.trackWidth) ? req.body.trackWidth: '',
                rowsBetweenTracks: (req.body.rowsBetweenTracks) ? req.body.rowsBetweenTracks: '',
                
                soilType: (req.body.soilType) ? req.body.soilType: '',
                terrainTopo: (req.body.terrainTopo) ? req.body.terrainTopo.toString(): '',

                terrainSlope: (req.body.terrainSlope) ? req.body.terrainSlope.toString(): '',
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
                        message: req.__('Area Created!'),
                        data: newArea,
                    }));
                }
            })
        })
    }
    updateArea(req, res){
        req.checkBody('areaId', 'areaId is required').required();
        req.checkBody('areaName', 'areaName is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            var area = {
                areaName: req.body.areaName,
                postCode: (req.body.postCode) ? req.body.postCode: '',
                yearOfEstablishment: (req.body.yearOfEstablishment) ? req.body.yearOfEstablishment: '',
                constructionMonth: (req.body.constructionMonth) ? req.body.constructionMonth: '',
                areaSize: (req.body.areaSize) ? req.body.areaSize: '',
                previousAgriculture: (req.body.previousAgriculture) ? req.body.previousAgriculture: '',
                previousChristmasTreesTurns: (req.body.previousChristmasTreesTurns) ? req.body.previousChristmasTreesTurns: '',
                plantMethod: (req.body.plantMethod) ? req.body.plantMethod.toString(): '',
 
                numberOfTrees: (req.body.numberOfTrees) ? req.body.numberOfTrees: '',
                organicProduction: (req.body.organicProduction) ? req.body.organicProduction: '',
                growAge: (req.body.growAge) ? req.body.growAge: '',
                productionTruns: (req.body.productionTruns) ? req.body.productionTruns: '',
                
                farmFieldId: (req.body.farmFieldId) ? req.body.farmFieldId: '',
                treeSize: (req.body.treeSize) ? req.body.treeSize: '',
                woodForm: (req.body.woodForm) ? req.body.woodForm: '',
                treeType: (req.body.treeType) ? req.body.treeType: '',
                operatingMode: (req.body.operatingMode) ? req.body.operatingMode: '',
                plantNumber: (req.body.plantNumber) ? req.body.plantNumber: '',
                plantSize: (req.body.plantSize) ? req.body.plantSize: 0,
                plantAge: (req.body.plantAge) ? req.body.plantAge: '',
                provenance: (req.body.provenance) ? req.body.provenance: '',
                planteafstand: (req.body.planteafstand) ? req.body.planteafstand: '',
                raekkeafstand: (req.body.raekkeafstand) ? req.body.raekkeafstand: '',
                plantPattern: (req.body.plantPattern) ? req.body.plantPattern: '',
                trackWidth: (req.body.trackWidth) ? req.body.trackWidth: '',
                rowsBetweenTracks: (req.body.rowsBetweenTracks) ? req.body.rowsBetweenTracks: '',
                
                soilType: (req.body.soilType) ? req.body.soilType: '',
                terrainTopo: (req.body.terrainTopo) ? req.body.terrainTopo.toString(): '',
                terrainSlope: (req.body.terrainSlope) ? req.body.terrainSlope.toString(): '',
                windExposure: (req.body.windExposure) ? req.body.windExposure: '',
                
                fence: (req.body.fence) ? req.body.fence : '',
	            notes: (req.body.notes) ? req.body.notes : '',

                //trees information; form 49
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            // save
            Factory.models.area.update({_id: req.body.areaId}, area, async(err, newArea) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with updating area functionality.')
                    }))
                }
                else{
                    /* update current tree number as well. */
                    Factory.helpers.calculateAllCurrentTreeNumbers(req.body.areaId);
                    /*  */

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Area Updated!'),
                        data: newArea,
                    }));
                }
            })
        })
    }

    insertAreaImages(req, res){
        console.log(req.body);
        req.checkBody('areaId', 'areaId is required.').required().isObjectId().withMessage('The selected area is invalid');
        req.checkBody('media', 'The media field is required without comment').required(req.files.media);

        if (req.files.media) {
            req.checkBody('media', 'Only image/video is allowed').hasImagesOrVideos(req.files.media);
        }

        console.log("comging to upload");

        req.getValidationResult().then(async (result) =>{
            if(!result.isEmpty()){
                console.log(result.array()[0].msg);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }
            console.log("no error found");
            //find area object from db
            //upload images

            /* Factory.models.area.findOne({_id: req.body.areaId}).exec((err, area)=>{
                console.log("area found");
                if(err){
                    console.log(err);
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong')
                    }))
                } */
                console.log(req.files);
                let uploadedImage = [];

                if (req.files.media) {
                    //remove all old images
                    console.log("remove old and upload new one");
                    //area.areaImages = [];
                    //area.save();
                    for (let index in req.files.media) {
                        uploadedImage[0] = await Factory.helpers.upload(req.files.media[index], 'areas');
                        await Factory.models.area.findOneAndUpdate(
                            { _id: req.body.areaId },
                            { "areaImages": uploadedImage }
                            /* { "$push": { "areaImages": Factory.helpers.upload(req.files.media[index], 'areas') } } */
                        ).exec(async(err, updatedArea)=>{
                            if(err){
                                console.log(err);
                            }
                        });
    
                        /* area.areaImages.push(
                            
                        ); */
                    }
                }

                

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Image uploaded"),
                    data: {areaImages: uploadedImage}
                }))
            })
            
        //})
    }

    getAreaData(req, res){
        req.checkBody('areaId', 'areaId is required').required();

        Factory.models.area.findOne({_id: req.body.areaId, userMysqlId: req.USER_MYSQL_ID})
        .exec(async(err, area) => {
            if(err){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Error retrieving area')
                }))
            }

            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Area found'),
                data: area
            }))
        })
    }

    getAllAreasOverview(req, res){
        Factory.models.area.find({
            userMysqlId: req.USER_MYSQL_ID
        })
        .populate({path: 'activities'})
        .exec(async(err, areas) =>{
            if(err){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Error retrieving area')
                }))
            }

            let result = [];
            for (let i = 0; i < areas.length; i++) {
                const thisArea = areas[i];
                
                
                /**
                 * calculate age
                 */
                let areaAge;
                let startDate = new Date();
                let nowDate = new Date();
                if(thisArea.yearOfEstablishment && thisArea.yearOfEstablishment != "")
                    startDate = new Date(thisArea.yearOfEstablishment, 1, 1);
                areaAge = nowDate.getFullYear() - startDate.getFullYear();
                console.log("year:"+thisArea.yearOfEstablishment);
                console.log(areaAge);

                
                /**
                 * calculate trees
                 */
                let totalTrees = 0;
                for (let j = 0; j < thisArea.activities.length; j++) {
                    const thisActivity = thisArea.activities[j];

                    let dateCompleted = new Date(thisActivity.dateCompleted);
                    let nowDate = new Date();
                    if(thisActivity.dateCompleted && thisActivity.quantity && dateCompleted.getTime() <= nowDate.getTime()){
                        
                        if(thisActivity.activityType == 'planting')
                            totalTrees += thisActivity.quantity;
                        else if(thisActivity.activityType == 'harvest' || thisActivity.activityType == 'scrap')
                            totalTrees -= thisActivity.quantity;
                    }
                }

                /**
                 * Arrange result
                 */
                let isFound = false;
                for (let k = 0; k < result.length; k++) {
                    const element = result[k];
                    if(element.age == areaAge)
                    {
                        result[k].trees += totalTrees;
                        result[k].area += thisArea.areaSize*1;
                        isFound = true;
                    }
                }

                if(!isFound){
                    let tempObject = {
                        age: areaAge,
                        trees: totalTrees,
                        area: thisArea.areaSize*1
                    }
                    result.push(tempObject);
                }
            }

            res.send(Factory.helpers.prepareResponse({
                message: req.__('Area found'),
                data: result,
            }));

        });
    }

    deleteArea(req, res){
        req.checkBody('areaId', 'areaId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            await Factory.models.activity.find({areaId: req.body.areaId}).remove().exec();
            await Factory.models.tree.find({areaId: req.body.areaId}).remove().exec();

            Factory.models.area.findOneAndRemove({_id: req.body.areaId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Area deleted'),
                    }));
                }
            })

        });
    }

    createActivity(req, res){
        req.checkBody('areaId', 'areaId is required').required();
        req.checkBody('activityType', 'activityType is required').required();
        req.checkBody('method', req.__('method is required')).required();

        if(req.body.activityType == "spraying" || req.body.activityType == "fertilizer")
            req.checkBody('mean', 'mean is required').required();

        ////console.log(req.body);

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            /* Factory.models.area.findOne({_id: req.body.areaId})
            .exec(async(err, myArea) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Area not found.')
                    }))
                } */

                let activity = {
                    userMysqlId: req.USER_MYSQL_ID,
                    areaId: req.body.areaId,

                    activityType: req.body.activityType,
                    scheduledMonth: (req.body.scheduledMonth) ? req.body.scheduledMonth : '',
                    scheduledDate: (req.body.scheduledDate) ? req.body.scheduledDate : '',
                    dateCompleted: (req.body.dateCompleted) ? req.body.dateCompleted : '',
                    status:(req.body.status) ? req.body.status : 'Plan',
                    dose: (req.body.dose) ? req.body.dose : '',
                    quantity: (req.body.quantity) ? req.body.quantity : '',
                    unitPrice1: (req.body.unitPrice1) ? req.body.unitPrice1 : '',
                    unitPrice2: (req.body.unitPrice2) ? req.body.unitPrice2 : '',
                    totalCost: (req.body.totalCost) ? req.body.totalCost : '',
                    performedBy: (req.body.performedBy) ? req.body.performedBy : '',
                    contractor: (req.body.contractor) ? req.body.contractor : '',
                    hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                    purpose: (req.body.purpose) ? req.body.purpose : '',
                    reported: (req.body.reported) ? req.body.reported : '',
                    notes: (req.body.notes) ? req.body.notes : '',

                    weatherCondition: (req.body.weatherCondition) ? req.body.weatherCondition : '',
                    wind: (req.body.wind) ? req.body.wind : '',
                    temperature: (req.body.temperature) ? req.body.temperature : '',
                    weather: (req.body.weather) ? req.body.weather : '',
                    
                    ageYear: (req.body.ageYear) ? req.body.ageYear : 0,
                    ageMonth: (req.body.ageMonth) ? req.body.ageMonth : 1,
                    
                    percentageOfTrees: (req.body.percentageOfTrees) ? req.body.percentageOfTrees: 0,
                    sellingPricePerUnit: (req.body.sellingPricePerUnit) ? req.body.sellingPricePerUnit: 0,

                    percentage: (req.body.percentage)? req.body.percentage: 100,

                    autoUpdate: (req.body.autoUpdate)? req.body.autoUpdate : false,

                    createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                    updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
                };

                if(req.body.mean)
                    activity['mean'] = req.body.mean;
                if(req.body.method)
                    activity['method'] = req.body.method;
                // save
                Factory.models.activity(activity).save(async(err, newActivity) => {
                    if(err){
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating activity functionality.')
                        }))
                    }

                    /* push activity to area */
                    Factory.models.area.findOneAndUpdate(
                        { _id: req.body.areaId },
                        { "$push": { "activities": newActivity._id } }
                    ).exec(async(err, updatedArea)=>{
                        if(err){
                            console.log(err);
                        }
                    });

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('activity Created!'),
                        data: newActivity,
                    }));



                    /* check if dateCompleted of activity is before or equal to today's date then update currentNumberOfTrees of Area */
                    /* let dateCompleted = new Date(req.body.dateCompleted);
                    let nowDate = new Date();

                    if(req.body.dateCompleted && req.body.quantity && dateCompleted.getTime() <= nowDate.getTime()){
                        console.log("Date comparison works!");
                        if(myArea.currentNumberOfTrees){
                            myArea.currentNumberOfTrees -= req.body.quantity;
                        }
                    }else{
                        console.log("Date comparison returned false.");
                    } */
                    /*  */
                    
                    /* console.log("Activities: ");
                    console.log(myArea);
                    myArea.activities.push(newActivity._id);
                    console.log("Activities: ");
                    console.log(myArea);

                    myArea.save(async(err, updatedArea) => {
                        if(err){
                            console.log(err);
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Vurdering oprettet.'),//area inside activity is not updated.
                            }))
                        }

                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('activity Created!'),
                            data: newActivity,
                        }));
                    }) */
                })
            })
        //})
    }

    getActivityData(req, res){
        req.checkBody('activityId', 'activityId is required').required();

        Factory.models.activity.findOne({_id: req.body.activityId, userMysqlId: req.USER_MYSQL_ID})
        .exec(async(err, activity) => {
            if(err){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Error retrieving activity')
                }))
            }

            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Activity found'),
                data: activity,
            }))
        })
    }

    updateAreaField(req, res){
      console.log("GETTING AREA DATA: ")
      console.log(req.body)
        req.checkBody('areaId', 'areaId is required').required();
        req.checkBody('fieldName', 'fieldName is required').required();
        req.checkBody('value', 'value is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let updateField ={};
            updateField[req.body.fieldName] = req.body.value;

            console.log(updateField);
            // save
            Factory.models.area.update({_id: req.body.areaId}, updateField, async(err, updatedArea) => {
                if(err){
                  console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with updating area field functionality.')
                    }))
                }

                if(req.body.fieldName == "numberOfTrees"){
                    /* update current tree number as well. */
                    Factory.helpers.calculateAllCurrentTreeNumbers(req.body.areaId);
                    /*  */
                }

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Field Updated!'),
                    data: updatedArea,
                }));
            })
        })
    }

    getAreaField(req, res){
      console.log("AREA FIELD REQUEST: ")
      let where = {}
      /**
       * if request is for openlayermapfeatures then it doesn't require areaId as it will send all areas features
       */
      if(req.body.fieldName !== 'openlayerMapFeatures')
        req.checkBody('areaId', 'areaId is required').required();
      req.checkBody('fieldName', 'fieldName is required').required();

      req.getValidationResult().then(async(result) => {
          if(!result.isEmpty()){
              return res.send(Factory.helpers.prepareResponse({
                  success: false,
                  message: req.__(result.array()[0].msg)
              }));
          }

          if(req.body.areaId != ''){
              where._id = req.body.areaId
          } else {
              where.userMysqlId = req.USER_MYSQL_ID
          }


          // save
          Factory.models.area.find(where).select('areaName '+req.body.fieldName).exec(async(err, areaField) => {
              if(err){
                console.log(err)
                  return res.send(Factory.helpers.prepareResponse({
                      success: false,
                      message: req.__('Something went wrong with getting area field functionality.')
                  }))
              }

              res.send(Factory.helpers.prepareResponse({
                  message: req.__('Field Found!'),
                  data: areaField,
              }));
          })
      })
    }

    updateActivity(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('activityType', 'activityType is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            var activity = {

                activityType: req.body.activityType,
                scheduledMonth: (req.body.scheduledMonth) ? req.body.scheduledMonth : '',
                scheduledDate: (req.body.scheduledDate) ? req.body.scheduledDate : '',
                dateCompleted: (req.body.dateCompleted) ? req.body.dateCompleted : '',
                status:(req.body.status) ? req.body.status : 'Plan',
                dose: (req.body.dose) ? req.body.dose : '',
                quantity: (req.body.quantity) ? req.body.quantity : '',
                unitPrice1: (req.body.unitPrice1) ? req.body.unitPrice1 : '',
                unitPrice2: (req.body.unitPrice2) ? req.body.unitPrice2 : '',
                totalCost: (req.body.totalCost) ? req.body.totalCost : '',
                performedBy: (req.body.performedBy) ? req.body.performedBy : '',
                contractor: (req.body.contractor) ? req.body.contractor : '',
                hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                purpose: (req.body.purpose) ? req.body.purpose : '',
                reported: (req.body.reported) ? req.body.reported : '',
                notes: (req.body.notes) ? req.body.notes : '',

                weatherCondition: (req.body.weatherCondition) ? req.body.weatherCondition : '',
                wind: (req.body.wind) ? req.body.wind : '',
                temperature: (req.body.temperature) ? req.body.temperature : '',
                weather: (req.body.weather) ? req.body.weather : '',
                
                ageYear: (req.body.ageYear) ? req.body.ageYear : 0,
                ageMonth: (req.body.ageMonth) ? req.body.ageMonth : 1,
                
                percentageOfTrees: (req.body.percentageOfTrees) ? req.body.percentageOfTrees: 0,
                sellingPricePerUnit: (req.body.sellingPricePerUnit) ? req.body.sellingPricePerUnit: 0,

                percentage: (req.body.percentage)? req.body.percentage: 100,
                autoUpdate: (req.body.autoUpdate)? req.body.autoUpdate : false,
                
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            if(req.body.mean && req.body.mean != '')
                activity['mean'] = req.body.mean;
            if(req.body.method && req.body.method != '')
                activity['method'] = req.body.method;

            // save
            Factory.models.activity.update({_id: req.body.activityId}, activity, async(err, newActivity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating activity functionality.')
                    }))
                }

                /* update current tree number as well. */
                Factory.helpers.calculateAllCurrentTreeNumbers(newActivity.areaId);
                /*  */

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Activity Updated!'),
                    data: newActivity,
                }));
            })
        })
    }

    updateActivityField(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('fieldName', 'fieldName is required').required();
        req.checkBody('value', 'value is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let updateField ={};
            updateField[req.body.fieldName] = req.body.value;

            console.log(updateField);
            // save
            Factory.models.activity.update({_id: req.body.activityId}, updateField, async(err, newActivity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating activity functionality.')
                    }))
                }

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Field Updated!'),
                    data: newActivity,
                }));
            })
        })
    }

    deleteActivity(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.activity.findOneAndRemove({_id: req.body.activityId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Activity deleted'),
                    }));
                }
            })

        });
    }
    
    createTree(req, res){
        console.log(req.body);

        //req.checkBody('areaMysqlId', 'areaMysqlId is required').required();
        let where = {};

        if(!req.body.areaId){
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
            let shotShapeIssues = '';
            let shotNeedleIssues = '';
            for (let i = 1; i < 20; i++) {
                const element = req.body['shotShapeIssues.'+i];
                if(element !== undefined)
                {
                    if(shotShapeIssues != '')
                        shotShapeIssues += ',';
                    console.log(element);
                    shotShapeIssues += element;
                }
            }
            for (let i = 1; i < 20; i++) {
                const element = req.body['shotNeedleIssues.'+i];
                
                if(element !== undefined)
                {
                    if(shotNeedleIssues != '')
                        shotNeedleIssues += ',';
                    ////console.log(element);
                    shotNeedleIssues += element;
                }
            }

            console.log(shotNeedleIssues);
            console.log(shotShapeIssues);
            
            Factory.models.area.findOne(where)
            .exec(async(err, area) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Area not found.')
                    }))
                }
                let today = new Date();
                let treeAge = '';
                //console.log("Age of "+today.getFullYear() +"-"+ area.yearOfEstablishment +" = ");
                /**
                 * old way of calculating age in simple year based
                 */
                /* if(area.yearOfEstablishment)
                    treeAge = today.getFullYear() - area.yearOfEstablishment; */

                /**
                 * New way: year starts from 1-7-yy
                 * 
                 */
                if(area.yearOfEstablishment && area.constructionMonth){
                    let startDate = new Date(area.yearOfEstablishment, 6, 1);
                    let endDate = today;
                    treeAge = endDate.getFullYear() - startDate.getFullYear();//( (new Date(endDate - startDate)).getFullYear() - 1970 );
                    //IF(E7>6,H7,J7)
                    //must verify if its saved as 0-11 or 1-12
                    let tempSum = 0;
                    let estMonth = (new AreaHelper()).converDanishMonthToNumber(area.constructionMonth);
                    if(estMonth > 5)
                        tempSum = 0;
                    else 
                        tempSum = 1;

                    //starting from zero
                    if(today.getMonth() > 5)
                        tempSum += 0;
                    else 
                        tempSum += -1;
                    
                    treeAge += tempSum;

                    if(treeAge < 0)
                        treeAge = 0;
                }
                console.log("Treeage: "+treeAge)

                var tree = {
                    areaId: area._id,
                    userMysqlId: req.USER_MYSQL_ID,
    
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
                // save
                Factory.models.tree(tree).save(async(err, newTree) => {
                    if(err){
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating tree functionality.')
                        }))
                    }

                    /* push activity to area */
                    Factory.models.area.findOneAndUpdate(
                        { _id: req.body.areaId },
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
                            console.log(err);
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('area inside tree is not updated.'),
                            }))
                        }

                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Tree Created!'),
                            data: newTree,
                        }));
                    }) */
                })
            })
        })
    }
    
    deleteTree(req, res){
        req.checkBody('treeId', 'treeId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.tree.findOneAndRemove({_id: req.body.treeId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Tree deleted'),
                    }));
                }
            })

        });
    }

    getAreas(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        let PER_PAGE_AREAS = Factory.env.PER_PAGE.AREAS;
        if(req.USER_MYSQL_ID == 1){
            where = {};
            PER_PAGE_AREAS = Factory.env.PER_PAGE.ADMIN_AREAS;
        }

        if(req.body.pagination == 'false')
            PER_PAGE_AREAS = 500;

        Factory.models.area.count(where, (err, count) => {
            let page = Math.abs(req.body.page);
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_AREAS),
                per_page: PER_PAGE_AREAS,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_AREAS;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.area.find(where, '_id areaName userMysqlId areaSize yearOfEstablishment numberOfTrees createdAt updatedAt')
                .lean(true)
                .limit(PER_PAGE_AREAS)
                .skip(skip)
                .exec(async(err, areas) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    if (!areas || areas.length <= 0) {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__('No area found'),
                            data: {
                                areas: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__('Area(s) found'),
                            data: {
                                areas: areas,
                                pagination: pagination,
                            }
                        }));
                    }
                });
            }
            else {
                res.send(Factory.helpers.prepareResponse({
                    message: req.__('No area found'),
                    data: {
                        areas: [],
                        pagination: pagination
                    }
                }));
            }
        });
    }

    getAllAreas(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        
        Factory.models.area.find(where, '_id areaName userMysqlId areaSize yearOfEstablishment numberOfTrees createdAt updatedAt')
        .lean(true)
        .exec(async(err, areas) => {
            if (err) {
                //console.log(err);
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Something went wrong, try later'),
                }));
            }
            if (!areas || areas.length <= 0) {
                res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__('No area found'),
                    data: {
                        areas: [],
                    },
                }));
            }
            else {
                res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__('Area(s) found'),
                    data: {
                        areas: areas,
                    }
                }));
            }
        });
    }

    getAreaDetails(req, res){
        req.checkBody('areaId', 'areaId is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.area.findOne({_id: req.body.areaId})
            .exec(async(err, area) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Area not found!")
                    }))
                }

                let timeSeries = await Factory.helpers.calculateAllTreeNumbersForArea(req.body.areaId);
                console.log("timeseries:" + timeSeries);
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Area found!"),
                    data: {
                        area,
                        timeSeries
                    },
                }))
            })
        });
    }

    getAreaGroupedActivities(req, res){
        req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [], where=[];
            let areaName = 'All Activities';

            
                where.push({'userMysqlId' : req.USER_MYSQL_ID});

                let now = new Date();

                let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
                let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");
                console.log(toDate);
                //toDate.setDate(toDate.getDate() + 1);
                //console.log(toDate);
                //toDate = toDate.add(1).day();
                /**
                 * where.push({'createdAt' : { $gte: fromDate, $lt: toDate}});
                 */
                //where.push({'dateCompleted' : { $gte: fromDate, $lt: toDate}});


                // if(req.body.status && req.body.status != '')
                //     where.push({'status': req.body.status});
                let dateFilter = {};
                if(req.body.fromDate && req.body.toDate)
                    dateFilter = {dateCompleted: { $gte: fromDate, $lt: toDate}};
                else if(req.body.toDate)
                    dateFilter = {dateCompleted: { $lt: toDate}};
                else if(req.body.fromDate)
                    dateFilter = {dateCompleted: { $gte: fromDate}};


                let areaIdFilter = {};
                if(req.body.areaId)
                    areaIdFilter = {'areaId': {$eq: req.body.areaId}};
                else
                    areaIdFilter = {'areaId': {$ne: null}};

                let statusFilter = {};
                if(req.body.status && req.body.status != '')
                    statusFilter = {'status': {$eq: req.body.status}};
                else
                    statusFilter = {'status': {$ne: null}};

                let activityTypeFilter = {};
                if(req.body.activityType && req.body.activityType != '')
                    activityTypeFilter = {'activityType': req.body.activityType};
                    

                match = {
                    $and: [
                        {userMysqlId: req.USER_MYSQL_ID},
                        dateFilter,
                        areaIdFilter,
                        statusFilter,
                        activityTypeFilter
                    ]
                };

                console.log(statusFilter);
                console.log(areaIdFilter);
                console.log(activityTypeFilter);
                

            Factory.models.activity.find(match)
            .populate({path: 'areaId', select: '_id areaName', model: Factory.models.area})
            .populate('mean')
            .populate('method')
            .exec(async(err, result)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                //console.log(result);
                
                if(req.body.freeTextSearch && req.body.freeTextSearch != ''){
                    for(let index = 0; index < result.length; index++){
                        let key2 = result[index];
                        if(
                            (key2.method && key2.method.name && key2.method.name.toLowerCase().includes(req.body.freeTextSearch.toLowerCase())) ||
                            (key2.mean && key2.mean.name && key2.mean.name.toLowerCase().includes(req.body.freeTextSearch.toLowerCase())) ||
                            (key2.performedBy && key2.performedBy.toLowerCase().includes(req.body.freeTextSearch.toLowerCase())) ||
                            (key2.contractor && key2.contractor.toLowerCase().includes(req.body.freeTextSearch.toLowerCase()))
                        ){
                            console.log("not deleting: "+index);
                        }
                        else{
                            console.log("deleting: "+index);
                            result.splice(index,1);
                            index--;
                        }
                    }
                }

                /**
                 * Calculations sum
                 */
                let totalCost = 0;
                let totalUnitPrice = 0;
                let totalHoursSpent = 0;
                for (let index = 0; index < result.length; index++) {
                    const val = result[index];
                    if(!isNaN(val.totalCost))
                        totalCost += val.totalCost;
                    if(!isNaN(val.unitPrice2))
                        totalUnitPrice += val.unitPrice2;
                    if(!isNaN(val.hoursSpent))
                        totalHoursSpent += val.hoursSpent;
                }
                let costCalculations = {};
                costCalculations['totalCost'] = totalCost;
                costCalculations['totalUnitPrice'] = totalUnitPrice;
                costCalculations['totalHoursSpent'] = totalHoursSpent;


                /**
                 * pagination
                 */
                let count = result.length;

                let page = Math.abs(req.query.page);
                let pagination = {
                    total: count,
                    pages: Math.ceil(count / Factory.env.PER_PAGE.ACTIVITIES),
                    per_page: Factory.env.PER_PAGE.ACTIVITIES,
                    page: isNaN(page) ? 1:page,
                };
                if (pagination.page <= pagination.pages) {
                    let skip = (pagination.page-1)*Factory.env.PER_PAGE.ACTIVITIES;
                    pagination.previous = pagination.page - 1;
                    pagination.next = pagination.page + 1;

                    let paginatedResult = result.splice(skip, pagination.per_page);

                    console.log("my hateful pagination: ");
                    console.log(pagination);

                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Activities data.'),
                        data: paginatedResult,
                        pagination: pagination,
                        extras: costCalculations
                    }))
                }else{
                    console.log("my lovely page: "+pagination.page);
                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Activities data.'),
                        data: [],
                        pagination: pagination,
                        extras: costCalculations
                    }))

                }
                
                /**
                 * end
                 */

                
                /* let activitiesMap = Factory.helpers.groupBy(result, activity=>activity.activityType);
                if(!req.body.areaId){
                    if(req.body.freeTextSearch && req.body.freeTextSearch != ''){
                        ////console.log(methodPopulatedResult);
                        for (let key of activitiesMap.keys()) {
                            ////console.log(activitiesMap.get(key));
                            for(let index = 0; index < activitiesMap.get(key).length; index++){
                                ////console.log(index);
                                let key2 = activitiesMap.get(key)[index];
                                if(
                                    (key2.method && key2.method.name && key2.method.name.includes(req.body.freeTextSearch)) ||
                                    (key2.mean && key2.mean.name && key2.mean.name.includes(req.body.freeTextSearch)) ||
                                    (key2.performedBy && key2.performedBy.includes(req.body.freeTextSearch))
                                ){
                                    ////console.log("not deleting: "+index);
                                }
                                else{
                                    ////console.log("deleting: "+index);
                                    activitiesMap.get(key).splice(index,1);
                                    index--;
                                }

                            }
                        }
                    }
                        
                } */
                ////console.log();
                ////console.log(Factory.helpers.groupBy(result, activity=>activity.activityType));
                /* return res.send(Factory.helpers.prepareResponse({
                            message: req.__('Activities data.'),
                            data: JSON.stringify([...activitiesMap])
                        })); */
            })


            /*aggregation = [
                { $match: match},
                {$group:{"_id":"$activityType", activities: { $push: "$$ROOT"}}},
            ];

            Factory.models.activity.aggregate(aggregation)
            .exec(async(err, result)=>{
                if(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: 'Error finding activities.'
                    }))

                if(result){
                    
                    ////console.log(JSON.stringify(result));

                    Factory.models.inventory.populate(result, {path: 'activities.mean'}, async(err, meanPopulatedResult) =>{
                            if(err){
                                //console.log(err);
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: err
                                }));
                            }
                            //console.log(meanPopulatedResult);
                            Factory.models.method.populate(meanPopulatedResult, {path: 'activities.method'}, async(err, methodPopulatedResult) => {
                                //console.log(methodPopulatedResult);
                                if(!req.body.areaId){
                                    if(req.body.method && req.body.method != ''){
                                        ////console.log(methodPopulatedResult);
                                        methodPopulatedResult.forEach(function(val, index, list){
                                            ////console.log(val);
                                            //console.log(1);
                                            for (let index2 = list[index].activities.length -1; index2 >=0; index2--) {
                                                if(!list[index].activities[index2].method.name.includes(req.body.method)){
                                                    list[index].activities.splice(index2, 1);
                                                }
                                            }
                                        })
                                    }
                                        
                                }
                                return res.send(Factory.helpers.prepareResponse({
                                    message: req.__('Activities data.'),
                                    data: methodPopulatedResult
                                }));
                            });
                    });
                }else{
                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('No activities data found.'),
                        data: {}
                    }));
                }
                
            });*/
        });
        
    }

    getAreaTreeTimeSeriesActivities(req, res){
        req.checkBody('areaId', 'areaId is required.').required();

        req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [];

            if(req.body.areaId){
                match['areaId'] = req.body.areaId;
                match['activityType'] = {$in: ['harvest', 'scrap', 'planting']};
            }else{
                //not needed for now.
                match['userMysqlId'] = req.USER_MYSQL_ID;

                let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date("1970-01-01");
                let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date();
                toDate.setDate(toDate.getDate() + 1);
                //toDate = toDate.add(1).day();
                match['createdAt'] = { $gte: fromDate, $lt: toDate};

                if(req.body.status && req.body.status != '')
                    match['status'] = req.body.status;

                if(req.body.areaId)
                    match['areaId'] = {$eq: req.body.areaId};
                else
                    match['areaId'] = {$ne: null};
                
            }

            Factory.models.activity.find(match)
            .sort({dateCompleted: 1})
            .exec(async(err, result)=>{
                if(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))

                // console.log();
                // console.log(result);
                return res.send(Factory.helpers.prepareResponse({
                            message: req.__('Timeseries data.'),
                            data: result
                        }));
            })
        });
    }

    getTreesGraphData(req, res){
        console.log(req.body.age);
        let chartsFilter = [];
        if(req.body.charts){
            chartsFilter = req.body.charts.split(',');
        }
        
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let match = {}, aggregation = [];
            let areaName = 'Kulturer af samme alder';//'All Users';
            let areaAge = req.body.age;
            
            let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date("1970-01-01");
            let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date();
            toDate.setDate(toDate.getDate() + 1);
            match['createdAt'] = { $gte: fromDate, $lt: toDate};
            
            

            if(req.body.areaId){
                match['areaId'] = req.body.areaId;
                let thisArea = await Factory.models.area.findOne({_id: req.body.areaId})
                .exec();
                if(thisArea){
                    areaName = thisArea.areaName;
                    if(areaAge == -1){
                        let startDate = new Date();
                        let nowDate = new Date();

                        if(thisArea.yearOfEstablishment && thisArea.yearOfEstablishment != "")
                            startDate = new Date(thisArea.yearOfEstablishment, 1, 1);                        
                        // console.log("DATE:");
                        // console.log(thisArea.growAge);
                        // console.log(startDate);
                        areaAge = nowDate.getFullYear() - startDate.getFullYear();
                        //console.log(areaAge);
                    }
                }
            }else{
                //check for all other users.
                /* match = {
                    userMysqlId: {$ne: req.USER_MYSQL_ID}
                } */

                if(req.body.otherUsers)
                    match['userMysqlId'] = {$ne: req.USER_MYSQL_ID};
                else
                    match['userMysqlId'] = {$eq: req.USER_MYSQL_ID};
            }

            if(req.body.age){
                match['age'] = areaAge*1;
            }
            console.log("MATCH:");
            console.log(match);
            

            let properties = [
                            {'fieldName':'treeHeight', 'graphName': 'Træhøjde', 'defaultValues': ['0-50','50-80','80-100','100-125','125-150','150-175','175-200','200-225','225-250','+250']},
                            {'fieldName':'typeOfDensity', 'graphName': 'Type tæthed', 'defaultValues': ['tæt', 'standard', 'åben']},
                            {'fieldName':'topLength', 'graphName': 'Topskudslængde', 'defaultValues': ['0-5','5-10','10-15','15-20','20-25','25-30','30-35','35-40','40-45','45-50','+50']},
                            {'fieldName':'yourAssessment', 'graphName': 'Din vurdering af træet', 'defaultValues': ['Prima','Standard','Uklassificeret', 'Skrot']},
                            {'fieldName':'treeColor', 'graphName': 'Træets overordnede farveudtryk', 'defaultValues': [0,1,2,3,4,5,6,7,8,9,10,11]}, 
                            {'fieldName':'shotShapeIssues', 'graphName': 'Deklassificerende forhold i træet', 'defaultValues': ['Ingen','Manglende topskud/dødt topskud','skævt/knækket topskud','Flere topskud','Topskud fra sidegren','Opadstræbende grene i 2. grenkrans','Bajonetskud','Skæv hovedstamme','Anden fejlsymmetri']}, 
                            /* {'fieldName':'treeFormType', 'graphName': 'Formtype', 'defaultValues': ['1','2','3','4','5','6']}, */
                            {'fieldName':'treeHeightWidthRatio', 'graphName': 'Træernes bredde i forhold til højde', 'defaultValues': ['<30%','30-40%','40-50%','50-60%','60-70%','70-80%','80-90%','90-100%','100-110%','110-120%','120-130%','130+']},
                            {'fieldName':'shotNeedleIssues', 'graphName': 'Tilstand skud og nåle', 'defaultValues': ['Ingen','Nåletab skudspidser','Nåletab skudbasis (bare skuldre)','Gule nåle ved skudbasis','Gule nåle ved årsskud','Røde nåle ved årsskud','Røde nåle ved skudbasis','Røde/gule nålespidser','Kortvoksede nåle','Algebelægning','Døde skud','Anden nålefejl']},
                            {'fieldName':'nutrients', 'graphName': 'Nutrients', 'defaultValues': []},
                            ];

            let finalResult = {};
            let propertyType = '';
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i]['fieldName'];

                if(!(chartsFilter.indexOf(property)>=0))
                    continue;

                //console.log(property);
                if(property == 'shotShapeIssues' || property == 'shotNeedleIssues')
                    propertyType = 'multichoice';
                else
                    propertyType = '';

                // console.log(match);
                aggregation = [
                    { $match: match},
                    {$group:{"_id":"$"+property, count:{$sum:1}}}
                ];

                //console.log(aggregation);

                if(property == 'treeHeightWidthRatio'){
                    let graphData = await (new AreaHelper()).treeHeightWidthRatio(match);
                    let graphResult = await Factory.helpers.calculateGraphPercentages(graphData, properties[i], propertyType);
                    graphResult['property']['defaultValues'] = ['Smalt (<30%)','Smalt (30-40%)','Smalt (40-50%)','Smalt (50-60%)','Normal (60-70%)','Normal (70-80%)','Bredt (80-90%)','Bredt (110-120%)','Bredt (120-130%)','Bredt (130+)'];

                    finalResult[property] = graphResult;
                    //console.log(graphResult);
                }
                else if(property == 'nutrients'){
                    let thisMatch = {};
                    if(req.body.areaId){
                        thisMatch = {
                            areaId: req.body.areaId
                        }
                    }else{
                        continue;
                        /* if(req.body.otherUsers)
                            thisMatch['userMysqlId'] = {$ne: req.USER_MYSQL_ID};
                        else
                            thisMatch['userMysqlId'] = {$eq: req.USER_MYSQL_ID}; */
                    }

                    let graphData = await (new AreaHelper()).nutrientsTimeSeriesGraphs(thisMatch);
                    let graphResult = properties[i];
                    graphResult['graphType'] = 'timeseries';
                    graphResult['graphData'] = graphData;
                    console.log(graphData);
                    finalResult[property] = graphResult;
                }
                else{
                    let graphData = await Factory.models.tree.aggregate(aggregation).exec();
                    let graphResult = await Factory.helpers.calculateGraphPercentages(graphData, properties[i], propertyType);
                    finalResult[property] = graphResult;
                }
                //console.log(property);
                
                //finalResult.push(graphResult);
            }
            ////console.log(finalResult);
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Graph(s) data.'),
                data: {
                    areaName: areaName,
                    graphData: finalResult,
                    areaAge: areaAge,
                }
            }));
        });
    }


    getTreeHeightVsAssessmentGraphData(req, res){

        req.checkBody('areaId', 'areaId is required.');
        req.checkBody('areaChoice', 'areaChoice is required.');

        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let match = {}, aggregation = [];
            if(req.body.areaChoice === 'allAreas'){
                //match['areaId'] = {$ne: req.body.areaId};
                match['userMysqlId'] = req.USER_MYSQL_ID;
            }else if(req.body.areaChoice === 'otherAreas'){
                match['userMysqlId'] = {$ne: req.USER_MYSQL_ID};
            } else {
                match['areaId'] = req.body.areaId;
            }
            if(req.body.age){
                match['age'] = req.body.age*1;
            }

            console.log("Match")
            console.log(match)

            let properties = [
                {'fieldName':'treeHeight', 'graphName': 'Træhøjde', 'defaultValues': ['0-50','50-80','80-100','100-125','125-150','150-175','175-200','200-225','225-250','+250']},
                {'fieldName':'yourAssessment', 'graphName': 'Din vurdering af træet', 'defaultValues': ['Prima','Standard','Uklassificeret', 'Skrot']}
                ];

            let finalResult = {};
            let propertyType = '';
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i]['fieldName'];

                //console.log(property);
                if(property == 'shotShapeIssues' || property == 'shotNeedleIssues')
                    propertyType = 'multichoice';
                else
                    propertyType = '';

                // console.log(match);
                aggregation = [
                    { $match: match},
                    {$group:{"_id":"$"+property, count:{$sum:1}}}
                ];

                //console.log(aggregation);
                
                let graphData = await Factory.models.tree.aggregate(aggregation).exec();
                let graphResult = await Factory.helpers.calculateGraphPercentages(graphData, properties[i], propertyType);
                finalResult[property] = graphResult;

                //console.log(property);
                
                //finalResult.push(graphResult);
            }
            ////console.log(finalResult);
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Graph(s) data.'),
                data: {
                    graphData: finalResult,
                }
            }));
        });
    }



    /* Small Functions Routes */
    deductQuantityFromInventory(req, res){
        req.checkBody('activityId', 'activityId is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.activity.findOne({_id: req.body.activityId, deletedAt: null})
            .populate('mean')
            .exec(async(err, activity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                else if(!activity.mean){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Mean doesn't exists.")
                    }))
                }

                if(activity.isQuantityDeducted){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Quantity is already deducted!")
                    }))
                }

                activity.mean.quantity = (activity.mean.quantity*1 - activity.quantity*1);
                activity.isQuantityDeducted = true;
                if(req.body.statusDateToggle) {
                  activity.status = 'Udført';
                  activity.dateCompleted = new Date();
                }
                activity.mean.save();
                activity.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Quantity deducted from inventory! Quantity Left: ")+activity.mean.quantity,
                    data: {}
                }))
            })
        });
    }

    updateActivityStatus(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('status', 'status is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.activity.findOne({_id: req.body.activityId})
            .exec(async(err, activity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Activity not found!")
                    }))
                }

                activity.status = req.body.status;

                if(req.body.status == "Udført"){
                    activity.dateCompleted = (req.body.date)?req.body.date:'';
                }
                else if(req.body.status == "Plan"){
                    activity.scheduledDate = (req.body.date)?req.body.date:'';
                }

                activity.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Activity status updated!"),
                    data: activity
                }))
            })
        });
    }

    areaAllActivitiesCosts(req, res){
        req.checkBody('areaId', 'areaId is required').required();

        req.getValidationResult().then(async(result)=>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }
            Factory.models.area.findOne({_id: req.body.areaId})
            .populate('activities')
            .exec(async(err, area)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong.')
                    }))
                }

                
                //console.log(area); */
                let allActivities = area.activities;

                allActivities.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(a.dateCompleted) - new Date(b.dateCompleted);
                  });
                //area.activities.toObject();
                console.log(allActivities);
                /* let currentNumberOfTrees = area.numberOfTrees*1; */
                /* BIG CHANGE: start with zero */
                let currentNumberOfTrees = 0;
                console.log("Current Number of Trees:"+currentNumberOfTrees);

                let harvestTrees = 0, 
                    plantedTrees = 0,
                    totalCost = 0;

                for (var i = 0; i < allActivities.length; i++) {
                    if(allActivities[i].status == 'Udført' || allActivities[i].status == 'Plan' || allActivities[i].status == 'Plannd' ){
                        /* calculate current number of trees as well */
                        if(allActivities[i].activityType == 'harvest'){
                            //currentNumberOfTrees -= allActivities[i].quantity;
                            harvestTrees += allActivities[i].quantity;
                        }
                        else if(allActivities[i].activityType == 'planting'){
                            //currentNumberOfTrees += allActivities[i].quantity;
                            plantedTrees += allActivities[i].quantity;
                        }
                        
                        
                        totalCost += allActivities[i].totalCost + allActivities[i].unitPrice2;

                        console.log("After Quantity: "+currentNumberOfTrees);
                        console.log("Updated");
                    }
                }
                //area.save();

                

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Area costs.'),
                    data: {
                        harvestTrees:harvestTrees,
                        plantedTrees:plantedTrees,
                        totalCost:totalCost,
                    }
                }))
                
            })
        })
    }


    recalculateAllActivitiesCosts(req, res){
        req.checkBody('areaId', 'areaId is required').required();

        req.getValidationResult().then(async(result)=>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }
            Factory.models.area.findOne({_id: req.body.areaId})
            .populate('activities')
            .exec(async(err, area)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong.')
                    }))
                }

                
                //console.log(area); */
                let allActivities = area.activities;

                allActivities.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(a.dateCompleted) - new Date(b.dateCompleted);
                  });
                //area.activities.toObject();
                console.log(allActivities);
                /* let currentNumberOfTrees = area.numberOfTrees*1; */
                /* BIG CHANGE: start with zero */
                let currentNumberOfTrees = 0;
                console.log("Current Number of Trees:"+currentNumberOfTrees);

                for (var i = 0; i < allActivities.length; i++) {

                    if(allActivities[i].autoUpdate == false || allActivities[i].status == 'Udført')
                    {
                        //ignore if autoupdate has false value, but if it is not added in database then perform else condition
                    }
                    else
                    {
                        console.log("Updating");
                        console.log("Before Quantity: "+currentNumberOfTrees);
                        if(allActivities[i].method && allActivities[i].method != '' && allActivities[i].percentage)
                        {
                            /* Machine cost ~ unitprice2*/
                            //console.log(allActivities[i].unitPrice2);
                            let method = await Factory.models.method.findOne({_id: allActivities[i].method}).exec();
                            if(method.methodUnit == 'pcs'){
                                allActivities[i].unitPrice2 = method.unitPrice * currentNumberOfTrees*(allActivities[i].percentage/100);
                            }
                            else if(method.methodUnit == 'ha'){
                                allActivities[i].unitPrice2 = method.unitPrice * area.areaSize*(allActivities[i].percentage/100);
                            }
                            //console.log(allActivities[i].unitPrice2);

                            /* product quantity */
                            if(allActivities[i].activityType == 'spraying' || allActivities[i].activityType == 'fertilizing'){
                                if(method.methodUnit == "ha")
                                    allActivities[i].quantity = allActivities[i].dose * area.areaSize * (allActivities[i].percentage/100);
                                else if(method.methodUnit == "pcs")
                                    allActivities[i].quantity = allActivities[i].dose * currentNumberOfTrees*(allActivities[i].percentage/100);
                            }else{
                                //alert(currentNumberOfTrees);
                                //console.log("Now Current NoT: "+currentNumberOfTrees);
                                if(method.methodUnit == "ha")
                                    allActivities[i].quantity = area.areaSize * (allActivities[i].percentage/100);
                                else if(method.methodUnit == "pcs"){
                                    allActivities[i].quantity = currentNumberOfTrees*(allActivities[i].percentage/100);                                    
                                }
                            }
                        }

                        


                        /* total cost ~ product total cost */
                        /* unitPrice1 ~ product unit price */
                        //console.log(allActivities[i].totalCost);
                        if(allActivities[i].unitPrice1 && allActivities[i].quantity && allActivities[i].percentage)
                            allActivities[i].totalCost = allActivities[i].unitPrice1 * allActivities[i].quantity * (allActivities[i].percentage/100);
                        //console.log(allActivities[i].totalCost);
                        //new comment added
                        area.activities[i].save();
                        
                    }

                    /* calculate current number of trees as well */
                    if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                        currentNumberOfTrees -= allActivities[i].quantity;
                    else if(allActivities[i].activityType == 'planting')
                        currentNumberOfTrees += allActivities[i].quantity;

                    console.log("After Quantity: "+currentNumberOfTrees);
                    console.log("Updated");
                }
                area.save();

                

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Activities costs updated.'),
                    data: {}
                }))
                
            })
        })
    }
}