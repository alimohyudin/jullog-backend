let Factory = require('../../../util/factory');

class ActivityHelper {
    recalculateNumberOfTrees(areaId){
        Factory.models.area.findOne({_id: areaId})
        .populate('activities')
        .exec(async(err, area)=>{
            if(err){
                return;
            }

            
            //console.log(area); */
            let allActivities = await Factory.models.activity.find({areaId: areaId}).exec();

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
                /* calculate current number of trees */
                if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                    currentNumberOfTrees -= allActivities[i].meanTotalQuantity*1;
                else if(allActivities[i].activityType == 'planting')
                    currentNumberOfTrees += allActivities[i].meanTotalQuantity*1;

                console.log("After Quantity: "+currentNumberOfTrees);
                console.log("Updated");
            }
            area.currentNumberOfTrees = currentNumberOfTrees;
            area.numberOfTrees = currentNumberOfTrees;
            area.save();
            
        })
        return;
    }
    getActivitiesFilters(req){
        let where = {userMysqlId: req.USER_MYSQL_ID};

        if(req.body.activityId)
            where._id = Factory.mongoose.Types.ObjectId(req.body.activityId)
        if(req.body.activityCategory && req.body.activityCategory !== '')
            where.activityCategory = req.body.activityCategory
        if(req.body.activityType)
            where.activityType = req.body.activityType
        if(req.body.status)
            where.status = req.body.status
        
        if(req.body.areaId)
            where.areaId = req.body.areaId
        else if(req.body.allAreasActivities)
            where.areaId = {$ne: null}
        
        if(req.body.freeTextName && req.body.freeTextName != '')
            where.name = {$regex: ".*"+req.body.freeTextName+".*"}
        
        if(req.body.freeTextPerformedBy && req.body.freeTextPerformedBy != ''){
            where.$or = [
                { performedBy: {$regex: ".*"+req.body.freeTextPerformedBy+".*"} },
                { contractor: {$regex: ".*"+req.body.freeTextPerformedBy+".*"} }
            ]
        }

        if(req.body.freeTextMeanName && req.body.freeTextMeanName != ''){
            where.meanName = {$regex: ".*"+req.body.freeTextMeanName+".*", $options: 'i'};
        }

        where.deletedAt = null;

        /**
         * Date Fast Filter
         */
        if(req.body.dateFastFilter || req.body.fromDate || req.body.toDate){
            let now = new Date();

            let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
            let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");

            let dateCompleted = {};
            if(req.body.fromDate && req.body.toDate)
                dateCompleted = { $gte: fromDate, $lt: toDate};
            else if(req.body.toDate)
                dateCompleted = { $lt: toDate};
            else if(req.body.fromDate)
                dateCompleted = { $gte: fromDate};
            
            where.dateCompleted = dateCompleted;
        }
        /**
         * End
         */
        console.log(where)
        return where;
    }
    getAggregateForActivities(req, where, count = false, pagination=false){
        let minAreaAge = 0, maxAreaAge = 100;
        if(req.body.minAge && req.body.minAge != "")
            minAreaAge = req.body.minAge*1;
        if(req.body.maxAge && req.body.maxAge != "")
            maxAreaAge = req.body.maxAge*1;

        let aggregation = [
            { 
                $match: where 
            }
        ];
        if(req.body.allAreasActivities){
            aggregation = [
                { 
                    $match: where 
                }, 
                {
                    $addFields: {
                        areaId: {
                            $convert: {
                              input: "$areaId",
                              to: "objectId",
                              onError: "Cannot $convert to objectId"
                            }
                        }
                    }
                },
                { 
                    $lookup: {
                        from: 'areas',
                        localField: 'areaId',
                        foreignField: '_id',
                        as: 'areaId'
                    }
                },
                {
                    $unwind: "$areaId"
                },
                {
                    $addFields: {
                        "areaId.areaAge": {
                          "$subtract": [
                                {
                                    "$year": new Date()
                                },
                                {
                                    "$toInt": "$areaId.yearOfEstablishment"
                                }
                                
                          ]
                        }
                      }
                },
                {
                    $match: {
                        "areaId.areaAge":{
                            $lte: maxAreaAge,
                            $gte: minAreaAge
                        }
                    }
                },
            ];
        }
        if(count)
            aggregation.push({$count: "count"})
        else{
            aggregation.push({
                $sort: {
                    dateCompleted: 1
                }
            })
            aggregation.push({
                $skip: (pagination.page-1)*pagination.per_page
            })
            aggregation.push({
                $limit: pagination.per_page
            })
        }
        return aggregation;
    }
    async updateFavoriteLinkedActivities(id, req){
        var activity = {

            name: (req.body.name && req.body.name != '') ? req.body.name.toLowerCase() : '',

            methodUnit: (req.body.methodUnit) ? req.body.methodUnit : '',
            methodUnitPrice: (req.body.methodUnitPrice) ?  req.body.methodUnitPrice: 0,
            methodUnitsPerHour: (req.body.methodUnitsPerHour) ? req.body.methodUnitsPerHour: 0,
            plantDistance: (req.body.plantDistance) ? req.body.plantDistance : 0,
            rowDistance: (req.body.rowDistance) ? req.body.rowDistance : 0,
            trackPercentage: (req.body.trackPercentage) ? req.body.trackPercentage : 0,
            provenance: (req.body.provenance) ? req.body.provenance : 0,
            plantSize: (req.body.plantSize) ? req.body.plantSize : 0,
            plantAge: (req.body.plantAge) ? req.body.plantAge : 0,

            performedBy: (req.body.performedBy && req.body.performedBy != '') ? req.body.performedBy.toLowerCase() : '',
            contractor: (req.body.contractor && req.body.performedBy != '') ? req.body.contractor.toLowerCase() : '',
            purpose: (req.body.purpose) ? req.body.purpose : '',
            reported: (req.body.reported) ? req.body.reported : '',
            notes: (req.body.notes) ? req.body.notes : '',

            weatherCondition: (req.body.weatherCondition) ? req.body.weatherCondition : '',
            wind: (req.body.wind) ? req.body.wind : '',
            temperature: (req.body.temperature) ? req.body.temperature : '',
            weather: (req.body.weather) ? req.body.weather : '',
            
            // ageYear: (req.body.ageYear) ? req.body.ageYear : 0,
            // ageMonth: (req.body.ageMonth) ? req.body.ageMonth : 1,
            
            percentageOfTrees: (req.body.percentageOfTrees) ? req.body.percentageOfTrees: 0,
            //sellingPricePerUnit: (req.body.sellingPricePerUnit) ? req.body.sellingPricePerUnit: 0,

            percentage: (req.body.percentage)? req.body.percentage: 100,
            //autoUpdate: (req.body.autoUpdate)? req.body.autoUpdate : false,
            
            updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
        }

        if(req.body.mean){
            activity['mean'] = req.body.mean;
            activity['meanName'] = req.body.meanName;
            activity['meanUnitPrice'] = req.body.meanUnitPrice;
            activity['meanDose'] = req.body.meanDose;
            //activity['meanQuantity'] = req.body.meanQuantity;
            activity['meanUnit'] = req.body.meanUnit;
            //activity['meanTotalQuantity'] = req.body.meanTotalQuantity;
        }

        let bulkOp = Factory.models.activity.collection.initializeOrderedBulkOp();

        bulkOp.find({templateId: id.toString(), autoUpdate: true}).update({ $set: activity});
        await bulkOp.execute( function (err){
            if(err)
                console.error(err);
        });
        // if(req.body.mean){
            let aggregation = [
                { $match: {templateId: id.toString(), autoUpdate: true}},
                {$group:{"_id":"$areaId", count:{$sum:1}}}
            ];
            console.log(aggregation)
            let areaIds = await Factory.models.activity.aggregate(aggregation).exec();
            for (let index = 0; index < areaIds.length; index++) {
                const areaId = areaIds[index];
                if(areaId)
                    await Factory.helpers.recalculateAllActivitiesCost(areaId, req)
            }
        //}
    }
}
/**
 * ActivityController
 * @class
 */
class ActivityController {
    /**
     * Create Activity
     * @function
     * @param {String} areaId {@link AreaSchema}._id
     * @param {String} activityType {@link ActivitySchema}.activityType
     * @param {String} activityCategory
     * @description Creates activity type under an area
     * @returns {PrepareResponse} Returns the Default response object.
     */
    createActivity(req, res){
        //req.checkBody('areaId', 'areaId is required').required();
        req.checkBody('activityType', 'activityType is required').required();
        req.checkBody('activityCategory', req.__('activityCategory is required')).required();

        // if(req.body.activityType == "spraying" || req.body.activityType == "fertilizer")
        //     req.checkBody('mean', 'mean is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            let activity = {
                userMysqlId: req.USER_MYSQL_ID,
                areaId: (req.body.areaId) ? req.body.areaId : null,
                planId: (req.body.planId) ? req.body.planId : null,
                templateId: (req.body.templateId) ? req.body.templateId : null,
                activityCategory: req.body.activityCategory,
                name: (req.body.name && req.body.name != '') ? req.body.name.toLowerCase() : '',

                methodUnit: (req.body.methodUnit) ? req.body.methodUnit : '',
                methodUnitPrice: (req.body.methodUnitPrice) ?  req.body.methodUnitPrice: 0,
                methodUnitsPerHour: (req.body.methodUnitsPerHour) ? req.body.methodUnitsPerHour: 0,
                plantDistance: (req.body.plantDistance) ? req.body.plantDistance : 0,
                rowDistance: (req.body.rowDistance) ? req.body.rowDistance : 0,
                trackPercentage: (req.body.trackPercentage) ? req.body.trackPercentage : 0,
                provenance: (req.body.provenance) ? req.body.provenance : 0,
                plantSize: (req.body.plantSize) ? req.body.plantSize : 0,
                plantAge: (req.body.plantAge) ? req.body.plantAge : 0,
                

                activityType: req.body.activityType,
                scheduledMonth: (req.body.scheduledMonth) ? req.body.scheduledMonth : '',
                scheduledDate: (req.body.scheduledDate) ? req.body.scheduledDate : '',
                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                status:(req.body.status) ? req.body.status : 'Plan',
                // dose: (req.body.dose) ? req.body.dose : '',
                // quantity: (req.body.quantity) ? req.body.quantity : '',
                meanCost: (req.body.meanCost) ? req.body.meanCost : '',
                meanTotalQuantity: (req.body.meanTotalQuantity) ? req.body.meanTotalQuantity: 0,
                machineCost: (req.body.machineCost) ? req.body.machineCost : '',
                totalCost: (req.body.totalCost) ? req.body.totalCost : '',
                performedBy: (req.body.performedBy && req.body.performedBy != '') ? req.body.performedBy.toLowerCase() : '',
                contractor: (req.body.contractor && req.body.performedBy != '') ? req.body.contractor.toLowerCase() : '',
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

                autoUpdate: (req.body.autoUpdate)? req.body.autoUpdate : true,

                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            };

            if(req.body.mean){
                activity['mean'] = req.body.mean;
                activity['meanName'] = req.body.meanName;
                activity['meanUnitPrice'] = req.body.meanUnitPrice;
                activity['meanDose'] = req.body.meanDose;
                activity['meanQuantity'] = req.body.meanQuantity;
                activity['meanUnit'] = req.body.meanUnit;
                activity['meanTotalQuantity'] = req.body.meanTotalQuantity;
            }
            // save
            Factory.models.activity(activity).save(async(err, newActivity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating activity functionality.')
                    }))
                }

                /* push activity to area */
                if(req.body.areaId)
                {
                    Factory.models.area.findOneAndUpdate(
                        { _id: req.body.areaId },
                        { "$push": { "activities": newActivity._id } }
                    ).exec(async(err, updatedArea)=>{
                        if(err){
                            console.log(err);
                        }
                        if(req.body.activityType == "harvest" || req.body.activityType == "scrap" || req.body.activityType == "planting")
                            (new ActivityHelper()).recalculateNumberOfTrees(req.body.areaId);
                    });
                }
                else if(req.body.planId)
                {
                    Factory.models.growthPlan.findOneAndUpdate(
                        { _id: req.body.planId },
                        { "$push": { "activities": newActivity._id } }
                    ).exec(async(err, updatedArea)=>{
                        if(err){
                            console.log(err);
                        }
                    });
                }

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('activity Created!'),
                    data: newActivity,
                }));
            })
        })
    }

    /**
     * Update Activity
     * @function
     * @param {ActivitySchema} Form_Data
     * @param {String} activityId {@link ActivitySchema}._id
     * @param {String} activityType {@link ActivitySchema}.activityType
     * @description update activity type under an area
     * @returns {PrepareResponse} Returns the Default response object.
     */
    updateActivity(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        //req.checkBody('activityType', 'activityType is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            var activity = {

                //activityType: req.body.activityType,
                //templateId: (req.body.templateId) ? req.body.templateId : null,
                name: (req.body.name && req.body.name != '') ? req.body.name.toLowerCase() : '',

                methodUnit: (req.body.methodUnit) ? req.body.methodUnit : '',
                methodUnitPrice: (req.body.methodUnitPrice) ?  req.body.methodUnitPrice: 0,
                methodUnitsPerHour: (req.body.methodUnitsPerHour) ? req.body.methodUnitsPerHour: 0,
                plantDistance: (req.body.plantDistance) ? req.body.plantDistance : 0,
                rowDistance: (req.body.rowDistance) ? req.body.rowDistance : 0,
                trackPercentage: (req.body.trackPercentage) ? req.body.trackPercentage : 0,
                provenance: (req.body.provenance) ? req.body.provenance : 0,
                plantSize: (req.body.plantSize) ? req.body.plantSize : 0,
                plantAge: (req.body.plantAge) ? req.body.plantAge : 0,

                scheduledMonth: (req.body.scheduledMonth) ? req.body.scheduledMonth : '',
                scheduledDate: (req.body.scheduledDate) ? req.body.scheduledDate : '',
                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                status:(req.body.status) ? req.body.status : 'Plan',
                // dose: (req.body.dose) ? req.body.dose : '',
                // quantity: (req.body.quantity) ? req.body.quantity : '',
                meanCost: (req.body.meanCost) ? req.body.meanCost : '',
                meanTotalQuantity: (req.body.meanTotalQuantity) ? req.body.meanTotalQuantity: 0,
                machineCost: (req.body.machineCost) ? req.body.machineCost : '',
                totalCost: (req.body.totalCost) ? req.body.totalCost : '',
                performedBy: (req.body.performedBy && req.body.performedBy != '') ? req.body.performedBy.toLowerCase() : '',
                contractor: (req.body.contractor && req.body.performedBy != '') ? req.body.contractor.toLowerCase() : '',
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
                autoUpdate: (req.body.autoUpdate)? req.body.autoUpdate : true,
                
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            if(req.body.mean){
                activity['mean'] = req.body.mean;
                activity['meanName'] = req.body.meanName;
                activity['meanUnitPrice'] = req.body.meanUnitPrice;
                activity['meanDose'] = req.body.meanDose;
                activity['meanQuantity'] = req.body.meanQuantity;
                activity['meanUnit'] = req.body.meanUnit;
                activity['meanTotalQuantity'] = req.body.meanTotalQuantity;
            }

            // save
            Factory.models.activity.findOneAndUpdate({_id: req.body.activityId}, activity, { "new": true }, async(err, newActivity) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with updating activity functionality.')
                    }))
                }

                /* update current tree number as well. */
                //Factory.helpers.calculateAllCurrentTreeNumbers(newActivity.areaId);
                /*  */
                // if(newActivity.activityCategory == 'area'){
                //     if(newActivity.activityType == "harvest" || newActivity.activityType == "scrap" || newActivity.activityType == "planting"){
                //         (new ActivityHelper()).recalculateNumberOfTrees(newActivity.areaId);
                //     }
                //     // check if this activity is not missed 
                // }
                if(newActivity.activityCategory == 'template'){
                    await (new ActivityHelper()).updateFavoriteLinkedActivities(newActivity._id, req);
                    // check if this activity is not missed 
                }

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Activity Updated!'),
                    data: newActivity,
                }));
            })
        })
    }

    /**
     * Get activities with pagination
     * @function
     * @description Its using token to get userMysqlId stored in req.USER_MYSQL_ID.
     * @todo Return complete list of Template Activities for the Activity Form to show all templates to be selected.
     * @returns {PrepareResponse|ActivitySchema|Pagination} Returns the Default response object.  With `data` object containing activities and pagination
     */
    getActivities(req, res){
        
        let PER_PAGE_ACTIVITIES = (req.body.printMode)?2000:Factory.env.PER_PAGE.ACTIVITIES;

        let where = (new ActivityHelper()).getActivitiesFilters(req);
        let aggregate = (new ActivityHelper()).getAggregateForActivities(req, where, true);
        console.log(aggregate)
        Factory.models.activity.aggregate(aggregate).exec(function(err, countArray){
            console.log(err)
            console.log(countArray)
            let count = (countArray[0])?countArray[0].count:0;
            let page = ( req.query.page && req.query.page > 0)?Math.abs(req.query.page):1;
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_ACTIVITIES),
                per_page: PER_PAGE_ACTIVITIES,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_ACTIVITIES;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;

                aggregate = (new ActivityHelper()).getAggregateForActivities(req, where, false, pagination);
                Factory.models.activity.aggregate(aggregate).exec(async(err, activities) => {
                    if (err) {
                        console.error(err);
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!activities || activities.length <= 0) {
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No activity found"),
                            data: {
                                activities: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        // if(req.body.populateAreaNames){
                        //     activities = await Factory.models.area.populate(activities, {path: 'areaId', select: 'areaName areaSize'});
                        // }
                        
                        

                        let extras = {};
                        if(req.body.calculateAllCosts){
                            let aggregation = [
                                { $match: where},
                                {$group:{"_id":null, totalCost: {$sum:"$totalCost"}, machineCost: {$sum:"$machineCost"}, hoursSpent: {$sum:"$hoursSpent"}}}
                            ];
                            extras = await Factory.models.activity.aggregate(aggregation);
                            extras = extras[0]
                        }
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("Activities found"),
                            data: {
                                activities: activities,
                                pagination: pagination,
                                extras: extras
                            }
                        }));
                    }
                });
            }
            else {
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("No activity found"),
                    data: {
                        activities: [],
                        pagination: pagination
                    }
                }));
            }
        });
        
        /* Factory.models.activity.countDocuments(where, (err, count) => {
            let page = ( req.query.page && req.query.page > 0)?Math.abs(req.query.page):1;
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_ACTIVITIES),
                per_page: PER_PAGE_ACTIVITIES,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_ACTIVITIES;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.activity.find(where)
                .sort({dateCompleted: 1})
                .lean(true)
                .limit(PER_PAGE_ACTIVITIES)
                .skip(skip)
                .exec(async(err, activities) => {
                    if (err) {
                        console.error(err);
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!activities || activities.length <= 0) {
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No activity found"),
                            data: {
                                activities: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        if(req.body.populateAreaNames){
                            activities = await Factory.models.area.populate(activities, {path: 'areaId', select: 'areaName areaSize'});
                        }
                        
                        

                        let extras = {};
                        if(req.body.calculateAllCosts){
                            let aggregation = [
                                { $match: where},
                                {$group:{"_id":null, totalCost: {$sum:"$totalCost"}, machineCost: {$sum:"$machineCost"}, hoursSpent: {$sum:"$hoursSpent"}}}
                            ];
                            extras = await Factory.models.activity.aggregate(aggregation);
                            extras = extras[0]
                        }
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("Activities found"),
                            data: {
                                activities: activities,
                                pagination: pagination,
                                extras: extras
                            }
                        }));
                    }
                });
            }
            else {
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("No activity found"),
                    data: {
                        activities: [],
                        pagination: pagination
                    }
                }));
            }
        }); */
    }
    /* 
    getActivities(req, res){
        
        let PER_PAGE_ACTIVITIES = (req.body.printMode)?2000:Factory.env.PER_PAGE.ACTIVITIES;

        let where = (new ActivityHelper()).getActivitiesFilters(req);

        Factory.models.activity.countDocuments(where, (err, count) => {
            let page = ( req.query.page && req.query.page > 0)?Math.abs(req.query.page):1;
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_ACTIVITIES),
                per_page: PER_PAGE_ACTIVITIES,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_ACTIVITIES;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.activity.find(where)
                .sort({dateCompleted: 1})
                .lean(true)
                .limit(PER_PAGE_ACTIVITIES)
                .skip(skip)
                .exec(async(err, activities) => {
                    if (err) {
                        console.error(err);
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!activities || activities.length <= 0) {
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No activity found"),
                            data: {
                                activities: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        if(req.body.populateAreaNames){
                            activities = await Factory.models.area.populate(activities, {path: 'areaId', select: 'areaName areaSize'});
                        }
                        /**
                         * Filter by Area.Age min/max
                         * after activities have been populated with area info at areaId
                         */
                        /* let minAge = (req.body.minAge && req.body.minAge != "") ? req.body.minAge*1 : -1,
                        maxAge = (req.body.maxAge && req.body.maxAge != "") ? req.body.maxAge*1 : -1;

                        if(minAge != -1 || maxAge != -1){
                            activities = activities.find(function(element){
                                let areaSize = element.areaId.areaSize*1;
                                if(minAge != -1 && maxAge != -1)
                                    return areaSize >= minAge && areaSize <= maxAge
                                else if(minAge != -1)
                                    return areaSize >= minAge
                                if(maxAge != -1)
                                    return areaSize <= maxAge
                            })
                        } /
                        /**
                         * End
                         /

                        let extras = {};
                        if(req.body.calculateAllCosts){
                            let aggregation = [
                                { $match: where},
                                {$group:{"_id":null, totalCost: {$sum:"$totalCost"}, machineCost: {$sum:"$machineCost"}, hoursSpent: {$sum:"$hoursSpent"}}}
                            ];
                            extras = await Factory.models.activity.aggregate(aggregation);
                            extras = extras[0]
                        }
                        return res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("Activities found"),
                            data: {
                                activities: activities,
                                pagination: pagination,
                                extras: extras
                            }
                        }));
                    }
                });
            }
            else {
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("No activity found"),
                    data: {
                        activities: [],
                        pagination: pagination
                    }
                }));
            }
        });
    }
    /**
     * Update Activity Field
     * @function
     * @param {String} activityId {@link ActivitySchema}._id
     * @param {String} fieldName {@link ActivitySchema} field name to update
     * @param {String} value value for field
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With updated `data` object of type {@link ActivitySchema}
     */
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

    /**
     * Update Mean Journal Reported Array
     * @function
     * @param {String} activityId {@link ActivitySchema}._id
     * @param {String} fieldName {@link ActivitySchema} field name to update
     * @param {String} value value for field
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With updated `data` object of type {@link ActivitySchema}
     */
    updateMeanJournalReportedValue(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('meanIndex', 'mean index is required').required();
        req.checkBody('value', 'value is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.activity.findOne({_id: req.body.activityId, deletedAt: null})
            .exec(async(err, activity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                if(activity.meanJournalReported)
                    activity.meanJournalReported[req.body.meanIndex] = (req.body.value == "true")?true:false;
                else{
                    activity.meanJournalReported = Array.apply(null, Array(activity.mean.length)).map(function() { return false });
                    activity.meanJournalReported[req.body.meanIndex] = (req.body.value == "true")?true:false;
                }
                // activity.save();
                // res.send(Factory.helpers.prepareResponse({
                //     message: req.__('Field Updated!'),
                //     data: activity,
                // }));
                // save
                Factory.models.activity.update({_id: req.body.activityId}, activity, async(err, newActivity) => {
                    if(err){
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating activity functionality.')
                        }))
                    }

                    /* update current tree number as well. */
                    //Factory.helpers.calculateAllCurrentTreeNumbers(newActivity.areaId);
                    /*  */

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Activity Updated!'),
                        data: newActivity,
                    }));
                })
            });
        })
    }

    /**
     * Delete Activity
     * @function
     * @param {String} activityId {@link ActivitySchema}._id
     * @description Delete Activity
     * @returns {PrepareResponse} Returns the Default response object.
     */
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
}

module.exports = ActivityController