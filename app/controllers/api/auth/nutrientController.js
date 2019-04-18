let Factory = require('../../../util/factory');

class NutrientHelper{
    /**
     * Nutrients TimeSeries Graph helper
     */
    async nutrientsTimeSeriesGraphs(match, property, denominator = 'trees'){
        console.error('Denominator: '+denominator)
        let outputData = [];
        let data = await Factory.models.activity.find(match, null, {sort: {'dateCompleted': 1}}).exec();
        let activityAndArea = await Factory.models.area.findOne({_id: match.areaId}).exec();
        let totalTrees = 0;
        //console.log(data);
        //let quarterlyData = [];
        let quarterValue = 0;
        for (let i = 0; i < data.length; i++) {
            const thisActivity = data[i];
            //next activity for quarter completion
            let nextActivity = '';
            if(i+1<data.length){
                nextActivity = data[i+1];
            }

            let dateCompleted = new Date(thisActivity.dateCompleted);
            
            /**
             * calculate trees
             */
            
            let nowDate = new Date();
            if(thisActivity.dateCompleted && thisActivity.meanTotalQuantity){
                
                if(thisActivity.activityType == 'planting')
                    totalTrees += thisActivity.meanTotalQuantity;
                else if(thisActivity.activityType == 'harvest' || thisActivity.activityType == 'scrap')
                    totalTrees -= thisActivity.meanTotalQuantity;
            }

            /**
             * Calculation
             */
            if(thisActivity.mean && thisActivity.mean != ''){
                let totalNutrientsQuantity = 0;
                let trees = totalTrees;
                let areaSize = 1;

                let quarterMonth = 0;
                if(dateCompleted.getMonth() < 3)
                    quarterMonth = 0
                else if(dateCompleted.getMonth() < 6)
                    quarterMonth = 3
                else if(dateCompleted.getMonth() < 9)
                    quarterMonth = 6
                else if(dateCompleted.getMonth() < 12)
                    quarterMonth = 9
                
                let quarterYear = dateCompleted.getFullYear();

                

                for (let i = 0; i < thisActivity.mean.length; i++) {
                    const meanId = thisActivity.mean[i];
                    let nutrient = await Factory.models.inventory.findOne({'_id': meanId}).exec();
                    let nutrientPercentage = (nutrient[property] && nutrient[property] >= 0) ? nutrient[property]/100 : 0;
                    let nutrientQuantity = thisActivity.meanQuantity[i];
                    //totalNutrientsQuantity += nutrientQuantity * nutrientPercentage;
                    /* console.log("Details: ")
                    console.log(nutrient)
                    console.log(nutrientQuantity)
                    console.log(nutrient.nitrogen)
                    console.log(quantityNutrient)
                    console.log(totalTrees) */
                    let density = 1;

                    if(thisActivity.meanUnit[i] == 'Ltr'){
                        //liquid
                        //density = nutrient.density
                        density = (nutrient.density) ? nutrient.density : 1;
                        /* if(thisActivity.methodUnit == 'ha'){
                            areaSize = (activityAndArea.areaSize) ? activityAndArea.areaSize*1 : 0;
                            trees = 1;
                        }else{
                            areaSize = 1;
                        } */
                            
                    } /* else {
                        //solid
                        //density = 1
                        density = 1;
                        areaSize = 1
                        if(thisActivity.methodUnit == 'ha'){
                            areaSize = (activityAndArea.areaSize) ? activityAndArea.areaSize*1 : 0;
                            trees = 1;
                        }else{
                            areaSize = 1;
                        }
                    } */
                    totalNutrientsQuantity += (nutrientQuantity*1) * (nutrientPercentage*1) * (density*1);
                }
                areaSize = (activityAndArea.areaSize) ? activityAndArea.areaSize*1 : 1;
                if(denominator == 'areaSize'){
                    totalNutrientsQuantity /= areaSize;
                }else{
                    totalNutrientsQuantity /= trees;
                    //kg to mg
                    totalNutrientsQuantity *= 1000;
                }
                
                //let quantityNutrientPerTree = totalNutrientsQuantity / totalTrees;
                quarterValue += totalNutrientsQuantity;
                /**
                 * quartermonth = 0
                 * nextmonth = 2 i.e in same quarter so we will not push value yet but sum it in same quarter
                 * nextmonth = 3 i.e next quarter is coming up, so push the value now
                 */
                let pushData = false;
                if(nextActivity == ''){
                    outputData.push([
                        Date.UTC(dateCompleted.getFullYear(), quarterMonth, 1), quarterValue   
                    ]);
                    break;
                }

                let nextActivityDateCompleted = new Date(nextActivity.dateCompleted);
                if(quarterMonth == 0 && nextActivityDateCompleted.getMonth() > 2)
                    pushData = true;
                else if(quarterMonth == 3 && nextActivityDateCompleted.getMonth() > 5)
                    pushData = true;
                else if(quarterMonth == 6 && nextActivityDateCompleted.getMonth() > 8)
                    pushData = true;

                if(pushData && quarterYear != nextActivityDateCompleted.getFullYear()){
                    pushData = true;
                }

                if(pushData){
                    outputData.push([
                        Date.UTC(dateCompleted.getFullYear(), quarterMonth, 1), quarterValue
                    ]);
                    quarterValue = 0;
                }
                /* if(totalNutrientsQuantity >= 0){
                    outputData.push([
                        Date.UTC(dateCompleted.getFullYear(), dateCompleted.getMonth(), 1), totalNutrientsQuantity   
                    ]);
                } */
            }
        }
        return outputData;
    }
    /**
     * Nutrients TimeSeries Graph helper
     */
    async nutrientsTimeSeriesGraphs2(match, nutrientName){
        let outputData = [];
        let data = await Factory.models.nutrient.find(match, null, {sort: {'usedOnDate': 1}}).exec();
        // let aggregation = [
        //     { $match: match},
        //     {
        //         $group:{
        //             "_id":{ month: { $month: "$usedOnDate" }, day: { $dayOfMonth: "$usedOnDate" }, year: { $year: "$usedOnDate" } }, 
        //             value: {
        //                 $sum: "$"+nutrientName+".value"
        //             }
        //         }
        //     },
        //     {
        //         $sort:{
        //             _id: -1
        //         }
        //     }
        // ];
        // let data = await Factory.models.nutrient.aggregate(aggregation);
        console.log(data);

        for (let i = 0; i < data.length; i++) {
            const thisNutrient = data[i];
            let myDate = new Date(thisNutrient.usedOnDate);
            outputData.push([
                Date.UTC(myDate.getFullYear(), myDate.getMonth(), myDate.getDate()), thisNutrient[nutrientName].value
            ]);
        }
        return outputData;
    }
}

/**
 * NutrientController
 * @class
 */
class NutrientController {
    constructor() {}
    /**
     * Creates new nutrient
     * @function
     * @param {String} nutrientName
     * @param {String} type - [fertilizer, pesticide, material]
     * @param {NutrientSchema} FormData
     * @description Creates Plan under a user referenced to Mysql Database using token.<br>
     * Field: req.USER_MYSQL_ID
     * If req.USER_MYSQL_ID == 1 then store userMysqlType: 'admin' for admin nutrients to be separated
     * else 'customer'
     * @returns {PrepareResponse} Returns the Default response object. With `data` object having {@link NutrientSchema}
     */
    createNutrient(req, res){
        req.checkBody('type', 'type is required.').required();
        req.checkBody('areaId', 'areaId is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty())
            {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            let nutrient = {
                userMysqlId: req.USER_MYSQL_ID,
                areaId: req.body.areaId,

                userMysqlType: (req.USER_MYSQL_ID==1) ? 'admin' : 'customer',

                type: req.body.type,

                usedOnDate: (req.body.usedOnDate) ? req.body.usedOnDate : null,
                
                reaction:(req.body.reaction)? req.body.reaction : {},
                nitrogen:(req.body.nitrogen)? req.body.nitrogen : {},
                phosphorus:(req.body.phosphorus)? req.body.phosphorus : {},
                potassium:(req.body.potassium)? req.body.potassium : {},
                calcium:(req.body.calcium)? req.body.calcium : {},
                magnesium:(req.body.magnesium)? req.body.magnesium : {},
                sodium:(req.body.sodium)? req.body.sodium : {},
                sulfur:(req.body.sulfur)? req.body.sulfur : {},
                boron:(req.body.boron)? req.body.boron : {},
                chlorine:(req.body.chlorine)? req.body.chlorine : {},
                copper:(req.body.copper)? req.body.copper : {},
                iron:(req.body.iron)? req.body.iron : {},
                manganese:(req.body.manganese)? req.body.manganese : {},
                molybdenum:(req.body.molybdenum)? req.body.molybdenum : {},
                zinc:(req.body.zinc)? req.body.zinc : {},
                
                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.nutrient(nutrient)
            .save(async(err, nutrient) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later")
                    }))
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("nutrient created successfully."),
                    data: nutrient
                }))
            })
        });
    }
    /**
     * Get Nutrients with pagination
     * @function
     * @description Its using token to get userMysqlId stored in req.USER_MYSQL_ID.
     * @returns {PrepareResponse|NutrientSchema|Pagination} Returns the Default response object.  With `data` object containing Nutrient
     */
    getNutrients(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        let PER_PAGE_NUTRIENTS = Factory.env.PER_PAGE.NUTRIENTS;
        
        if(req.body.nutrientId)
            where._id = req.body.nutrientId;
        if(req.body.areaId)
            where.areaId = req.body.areaId;
        where.deletedAt = null;

        Factory.models.nutrient.count(where, (err, count) => {
            let page = Math.abs(req.body.page);
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_NUTRIENTS),
                per_page: PER_PAGE_NUTRIENTS,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_NUTRIENTS;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.nutrient.find(where)
                .lean(true)
                .limit(PER_PAGE_NUTRIENTS)
                .skip(skip)
                .exec(async(err, nutrients) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!nutrients || nutrients.length <= 0) {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No nutrient found"),
                            data: {
                                Nutrient: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("nutrient(s) found"),
                            data: {
                                nutrients: nutrients,
                                pagination: pagination,
                            }
                        }));
                    }
                });
            }
            else {
                res.send(Factory.helpers.prepareResponse({
                    message: req.__("No nutrient found"),
                    data: {
                        nutrients: [],
                        pagination: pagination
                    }
                }));
            }
        });
    }
    /**
     * Update nutrient
     * @function
     * @param {NutrientSchema} Form_Data
     * @param {String} NutrientId {@link NutrientSchema}._id
     * @param {String} type {@link NutrientSchema}.type
     * @description update Nutrient
     * @returns {PrepareResponse} Returns the Default response object.
     */
    editNutrient(req, res){
        req.checkBody('nutrientId', 'nutrientId is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.nutrient.findOne({_id: req.body.nutrientId})
            .exec(async(err, nutrient) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                nutrient.usedOnDate = (req.body.usedOnDate)? req.body.usedOnDate : null;
                nutrient.reaction = (req.body.reaction)? req.body.reaction : {};
                nutrient.nitrogen = (req.body.nitrogen)? req.body.nitrogen : {};
                nutrient.phosphorus = (req.body.phosphorus)? req.body.phosphorus : {};
                nutrient.potassium = (req.body.potassium)? req.body.potassium : {};
                nutrient.calcium = (req.body.calcium)? req.body.calcium : {};
                nutrient.magnesium = (req.body.magnesium)? req.body.magnesium : {};
                nutrient.sodium = (req.body.sodium)? req.body.sodium : {};
                nutrient.sulfur = (req.body.sulfur)? req.body.sulfur : {};
                nutrient.boron = (req.body.boron)? req.body.boron : {};
                nutrient.chlorine = (req.body.chlorine)? req.body.chlorine : {};
                nutrient.copper = (req.body.copper)? req.body.copper : {};
                nutrient.iron = (req.body.iron)? req.body.iron : {};
                nutrient.manganese = (req.body.manganese)? req.body.manganese : {};
                nutrient.molybdenum = (req.body.molybdenum)? req.body.molybdenum : {};
                nutrient.zinc = (req.body.zinc)? req.body.zinc : {};
                
                nutrient.save()
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("nutrient updated!"),
                    data: {}
                }))
            })
        });
    }

    /**
     * Delete nutrient
     * @function
     * @param {String} nutrientId {@link NutrientSchema}._id
     * @description Delete nutrient
     * @todo and also handle linked activities to this nutrient
     * @returns {PrepareResponse} Returns the Default response object.
     */
    deleteNutrient(req, res){
        req.checkBody('nutrientId', 'nutrientId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.nutrient.findOneAndRemove({_id: req.body.nutrientId}, function(err, deleteNoted){
                if (err) {
                    console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('nutrient deleted'),
                    }));
                }
            })

        });
    }

    /**
     * Get Trees Data for Graphs
     * @function
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {Date} [fromDate] {@link ActivitySchema}.createdAt
     * @param {Date} [toDate] {@link ActivitySchema}.createdAt
     * @param {Number} [age] {@link TreeSchema}.age
     * @param {String} [charts] Comma seperated charts names
     * @description It filters and aggregates trees data and send for the graphs.
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of custom type
     */
    getGraphData(req, res){
        req.checkBody('areaId', 'areaId is required').required();
        req.checkBody('nutrientType', 'nutrientType is required').required();
        req.checkBody('nutrientName', 'nutrientName is required').required();

        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            
            let properties = [
                            {'fieldName':req.body.nutrientName, 'graphName': req.body.nutrientName, 'defaultValues': []},
                            ];

            let finalResult = {};
            let propertyType = '';
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i]['fieldName'];

               if(property == req.body.nutrientName){
                    let thisMatch = {};
                    if(req.body.areaId){
                        thisMatch = {
                            areaId: req.body.areaId,
                            type: req.body.nutrientType+"Analysis"
                        }
                    }else{
                        continue;
                    }
                    let graphData = await (new NutrientHelper()).nutrientsTimeSeriesGraphs2(thisMatch, property);
                    let graphResult = properties[i];
                    graphResult['graphType'] = 'timeseries';
                    graphResult['graphData'] = graphData;

                    thisMatch = {areaId: req.body.areaId};
                    graphResult['NPKGraphData'] = '';//await (new NutrientHelper()).nutrientsTimeSeriesGraphs(thisMatch, property);
                    

                    thisMatch.type = req.body.nutrientType+"Goal";
                    let goal = await Factory.models.nutrient.findOne(thisMatch).exec();
                    if(goal != null){
                        graphResult['minValue'] = goal[property].min;
                        graphResult['maxValue'] = goal[property].max;
                    } else {
                        graphResult['minValue'] = 0;
                        graphResult['maxValue'] = 0;
                    }
                    
                    console.log(graphData);
                    finalResult[property] = graphResult;
                }
                
            }
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Graph(s) data.'),
                data: {
                    graphData: finalResult
                }
            }));
        });
    }

    /**
     * Get NPK Data for Graphs
     * @function
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {Date} [fromDate] {@link ActivitySchema}.createdAt
     * @param {Date} [toDate] {@link ActivitySchema}.createdAt
     * @param {Number} [age] {@link TreeSchema}.age
     * @param {String} [charts] Comma seperated charts names
     * @description It filters and aggregates trees data and send for the graphs.
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of custom type
     */
    getNPKGraphData(req, res){
        
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
            let denominator = req.body.denominator ? req.body.denominator : 'trees';
            
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

            console.log("MATCH:");
            console.log(match);
            

            let properties = [
                            {'fieldName':'nutrients', 'graphName': 'Nutrients', 'defaultValues': []},
                            ];

            let finalResult = {};
            let propertyType = '';
            for (let i = 0; i < properties.length; i++) {
                const property = properties[i]['fieldName'];
                
                if(property == 'nutrients'){
                    let thisMatch = {};
                    if(req.body.areaId){
                        thisMatch = {
                            areaId: req.body.areaId
                        }
                    }else{
                        continue;
                    }

                    let graphData = await (new NutrientHelper()).nutrientsTimeSeriesGraphs(thisMatch, req.body.nutrientName, denominator);
                    let graphResult = properties[i];
                    graphResult['graphType'] = 'timeseries';
                    graphResult['graphData'] = graphData;
                    console.log(graphData);
                    finalResult[property] = graphResult;
                }
                
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
}

module.exports = NutrientController