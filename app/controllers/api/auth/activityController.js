let Factory = require('../../../util/factory');

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

        if(req.body.activityType == "spraying" || req.body.activityType == "fertilizer")
            req.checkBody('mean', 'mean is required').required();

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
                name: (req.body.name) ? req.body.name : '',

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
                dateCompleted: (req.body.dateCompleted) ? req.body.dateCompleted : '',
                status:(req.body.status) ? req.body.status : 'Plan',
                dose: (req.body.dose) ? req.body.dose : '',
                quantity: (req.body.quantity) ? req.body.quantity : '',
                meanCost: (req.body.meanCost) ? req.body.meanCost : '',
                machineCost: (req.body.machineCost) ? req.body.machineCost : '',
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
                templateId: (req.body.templateId) ? req.body.templateId : null,
                name: (req.body.name) ? req.body.name : '',

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
                dateCompleted: (req.body.dateCompleted) ? req.body.dateCompleted : '',
                status:(req.body.status) ? req.body.status : 'Plan',
                dose: (req.body.dose) ? req.body.dose : '',
                quantity: (req.body.quantity) ? req.body.quantity : '',
                meanCost: (req.body.meanCost) ? req.body.meanCost : '',
                machineCost: (req.body.machineCost) ? req.body.machineCost : '',
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

            // save
            Factory.models.activity.update({_id: req.body.activityId}, activity, async(err, newActivity) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with updating activity functionality.')
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

    /**
     * Get activities with pagination
     * @function
     * @description Its using token to get userMysqlId stored in req.USER_MYSQL_ID.
     * @todo Return complete list of Template Activities for the Activity Form to show all templates to be selected.
     * @returns {PrepareResponse|ActivitySchema|Pagination} Returns the Default response object.  With `data` object containing activities and pagination
     */
    getActivities(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        let PER_PAGE_ACTIVITIES = Factory.env.PER_PAGE.ACTIVITIES;

        if(req.body.activityId)
            where._id = req.body.activityId
        if(req.body.activityCategory && req.body.activityCategory !== '')
            where.activityCategory = req.body.activityCategory
        if(req.body.activityType)
            where.activityType = req.body.activityType
        
        where.deletedAt = null;

        Factory.models.activity.count(where, (err, count) => {
            let page = Math.abs(req.body.page);
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
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!activities || activities.length <= 0) {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No activity found"),
                            data: {
                                activities: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("Activities found"),
                            data: {
                                activities: activities,
                                pagination: pagination,
                            }
                        }));
                    }
                });
            }
            else {
                res.send(Factory.helpers.prepareResponse({
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