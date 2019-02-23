let Factory = require('../../../util/factory');

/**
 * GrowthPlansController
 * @class
 */
class GrowthPlansController {

    constructor() {}
    /**
     * Creates new Plan
     * @function
     * @param {String} planName
     * @description Creates Plan under a user referenced to Mysql Database using token.<br>
     * Field: req.USER_MYSQL_ID
     * @returns {PrepareResponse} Returns the Default response object. With `data` object having {@link GrowthPlanSchema}
     */
    createPlan(req, res){
        req.checkBody('planName', 'planName is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty())
            {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            let growthPlan = {
                userMysqlId: req.USER_MYSQL_ID,
                name: req.body.planName,
                
                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.growthPlan(growthPlan)
            .save(async(err, newPlan) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('problem creating new plan.')
                    }))
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: "plan created successfully.",
                    data: newPlan
                }))
            })
        });
    }
    /**
     * Delete Plan
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @description Delete plan
     * @todo and also delete its all activities.
     * @returns {PrepareResponse} Returns the Default response object.
     */
    deletePlan(req, res){
        req.checkBody('planId', 'planId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.growthPlan.findOneAndRemove({_id: req.body.planId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Growth Plan deleted'),
                    }));
                }
            })

        });
    }
    /**
     * Create Activity
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @param {String} activityType {@link ActivitySchema}.activityType
     * @todo @param {String} method {@link MethodSchema}._id should be required
     * @description Creates activity type under an area
     * @deprecated No more use here. Use createActivity from {@link ActivityController}
     * @returns {PrepareResponse} Returns the Default response object.
     */
    createActivity(req, res){
        req.checkBody('planId', 'planId is required').required();
        req.checkBody('activityType', 'activityType is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.growthPlan.findOne({_id: req.body.planId})
            .exec(async(err, plan) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Selected area not found.')
                    }))
                }

                var activity = {
                    userMysqlId: req.USER_MYSQL_ID,
                    planId: req.body.planId,

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

                    ageYear: (req.body.ageYear) ? req.body.ageYear : 0,
                    ageMonth: (req.body.ageMonth) ? req.body.ageMonth : 1,
                    
                    percentage : (req.body.percentage) ? req.body.percentage: 100,

                    createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                    updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
                }

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

                    // push activity to area
                    Factory.models.growthPlan.findOneAndUpdate(
                        { _id: req.body.planId },
                        { "$push": { "activities": newActivity._id } }
                    ).exec(async(err, updatedArea)=>{
                        if(err){
                            console.log(err);
                        }
                    });

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Activity Created!'),
                        data: newActivity,
                    }));

                    // plan.activities.push(newActivity._id);
                    // plan.save(async(err, updatedPlan) => {
                    //     if(err){
                    //         return res.send(Factory.helpers.prepareResponse({
                    //             success: false,
                    //             message: req.__('Area for this activity is not updated.'),
                    //         }))
                    //     }

                    //     res.send(Factory.helpers.prepareResponse({
                    //         message: req.__('Activity Created!'),
                    //         data: newActivity,
                    //     }));
                    // })
                })
            })
        })
    }
    /**
     * Update Activity
     * @function
     * @param {ActivitySchema} Form_Data
     * @param {String} activityId {@link ActivitySchema}._id
     * @param {String} activityType {@link ActivitySchema}.activityType
     * @todo Make {String} method {@link MethodSchema}._id to be required
     * @description update activity
     * @deprecated No more use here. Use createActivity from {@link ActivityController}
     * @returns {PrepareResponse} Returns the Default response object.
     */
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
                
                
                ageYear: (req.body.ageYear) ? req.body.ageYear : 0,
                ageMonth: (req.body.ageMonth) ? req.body.ageMonth : 1,
                
                percentage : (req.body.percentage) ? req.body.percentage: 100,

                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }
            
            if(req.body.mean)
                activity['mean'] = req.body.mean;
            if(req.body.method)
                activity['method'] = req.body.method;
            // save
            Factory.models.activity.update({_id: req.body.activityId}, activity, async(err, newActivity) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating activity functionality.')
                    }))
                }

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('Activity Updated!'),
                    data: newActivity,
                }));
            })
        })
    }
    /**
     * Update Activity
     * @function
     * @param {String} activityId {@link ActivitySchema}._id
     * @param {String} [ageYear] {@link ActivitySchema}.ageYear
     * @param {String} [ageMonth] {@link ActivitySchema}.ageMonth
     * @description update activity age
     * @returns {PrepareResponse} Returns the Default response object.
     */
    updateActivityAge(req, res){
      req.checkBody('activityId', 'activityId is required').required();
      /* req.checkBody('ageYear', 'year is required').required();
      req.checkBody('ageMonth', 'month is required').required(); */

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
              if(req.body.ageYear)
                activity.ageYear = req.body.ageYear;
              if(req.body.ageMonth)
                activity.ageMonth = req.body.ageMonth;

              activity.save();
              
              return res.send(Factory.helpers.prepareResponse({
                  message: req.__("Activity status updated!"),
                  data: activity
              }))
          })
      });
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
    /**
     * Get All Growth Plans without pagination
     * @function
     * @description Its using token to get userMysqlId stored in req.USER_MYSQL_ID.
     * @returns {PrepareResponse|GrowthPlanSchema|Pagination} Returns the Default response object.  With `data` object containing Plans
     */
    getPlans(req, res){
        Factory.models.growthPlan.find({userMysqlId: req.USER_MYSQL_ID})
        .exec(async(err, plans) => {
            if(err){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('error retrieving plans')
                }))
            }

            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Plan(s) found'),
                data: plans
            }))
        })
    }
    /**
     * Get Activity Data
     * @function
     * @param {String} activityId {@link ActivitySchema}._id
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of type {@link ActivitySchema}
     */
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
                data: activity
            }))
        })
    }
    /**
     * Get Activities of a plan
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @description It populates {@link InventorySchema}
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of type {@link ActivitySchema}
     */
    getPlanActivities(req, res){
      req.checkBody('planId', 'planId is required').required();

        req.getValidationResult().then(async(result) =>{
          if(!result.isEmpty()){
              return res.send(Factory.helpers.prepareResponse({
                  success: false,
                  message: req.__(result.array()[0].msg)
              }));
          }

          let match = {};
          
          match['planId'] = req.body.planId;

          Factory.models.activity.find(match)
          .populate('mean')
          .exec(async(err, result)=>{
              if(err){
                  //console.log(err);
                  return res.send(Factory.helpers.prepareResponse({
                      success: false,
                      message: req.__('Error finding activities.')
                  }))
              }
                
              //console.log(activitiesMap);
              ////console.log(Factory.helpers.groupBy(result, activity=>activity.activityType));
              return res.send(Factory.helpers.prepareResponse({
                      message: req.__('Activities data.'),
                      data: result
                  }));
          });
      });
    }
    /**
     * Get Grouped Activities Based on Age Year of a plan
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @description It populates {@link InventorySchema}
     * @deprecated No more use for this function because grouping is no more needed.
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of type {@link ActivitySchema}
     */
    getPlanGroupedActivities(req, res){
        req.checkBody('planId', 'planId is required').required();

        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let match = {}, aggregation = [];
            let areaName = 'All Activities';
            
            match['planId'] = req.body.planId;

            aggregation = [
                { $match: match},
                {$group:{"_id":"$ageYear", activities: { $push: "$$ROOT"}}},
            ];


            Factory.models.activity.find(match)
            .populate('mean')
            .exec(async(err, result)=>{
                if(err){
                    //console.log(err);
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                let activitiesMap = Factory.helpers.groupBy(result, activity=>activity.ageYear);

                  
                //console.log(activitiesMap);
                ////console.log(Factory.helpers.groupBy(result, activity=>activity.activityType));
                return res.send(Factory.helpers.prepareResponse({
                            message: req.__('Activities data.'),
                            data: JSON.stringify([...activitiesMap])
                        }));
            });
        });
        
    }
    /**
     * Copy planned activities to an area
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @param {String} areaId {@link AreaSchema}._id
     * @description It uses {@link InventorySchema} to calculate quantity and cost
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.
     */
    copyPlanActivities(req, res){
        /* console.log("testing promise:")

        Factory.models.area.findOne({_id: req.body.areaId}).populate('activities').then(async function(res, err){
            console.log(res)
            for(let i =0; i<5; i++){
                console.log(i+" we are doing something else")
                //without async^ and await below, the following console.log is running separately and not inside this loop
                await Factory.models.area.findOne({_id: req.body.areaId}).then(function(res, err){
                    console.log("we retrieved in loop")
                })
            }
        }).then(function(){
            console.log("we finished working...")
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Plan copied'),
                data: {}
            }));
        })
        console.log("we are out")
        return; */

        

        req.checkBody('planId', 'planId is required').required();
        req.checkBody('areaId', 'areaId is required').required();

        console.log("COPYING GROW STRATEGY:");

        req.getValidationResult().then(async(result)=>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }
            Factory.models.area.findOne({_id: req.body.areaId})
            //.populate('activities')
            .then(async(area)=>{

                let plan = await Factory.models.growthPlan.findOne({_id: req.body.planId}).populate('activities').exec();
                /* //console.log(plan);

                //console.log(area); */
                let allActivities = await Factory.models.activity.find({areaId: req.body.areaId}).sort({dateCompleted: -1}).exec();
                //area.activities.toObject();
                //console.log(allActivities);
                console.log("Area Activities...")
                let currentNumberOfTrees = 0;
                for (var i = 0; i < allActivities.length; i++) {
                    console.log("id: "+allActivities[i]._id)
                    console.log(allActivities[i].status);

                    if(allActivities[i].status == "Plan" || allActivities[i].status == "Plannd")
                    {
                        await Factory.models.activity.findOneAndRemove({_id: allActivities[i]._id}).then((result, err) => {
                            if(err){
                                console.warn("couldn't delete activity")
                                console.error(err)
                            }else{
                                console.log("DELETED");
                            }
                            
                        });
                        //area.activities.splice(area.activities.indexOf(allActivities[i]._id), 1);
                    } else {
                        if(new Date(allActivities[i].dateCompleted).getTime() <= (new Date()).getTime()){
                            if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                                currentNumberOfTrees -= allActivities[i].meanTotalQuantity*1;
                            else if(allActivities[i].activityType == 'planting')
                                currentNumberOfTrees += allActivities[i].meanTotalQuantity*1;
                        }
                    }
                }
                console.log("Copy cnts: "+currentNumberOfTrees)
                area.save();

                let startDate;

                if(area.growAge !== undefined && area.growAge != null && area.growAge != ""){
                  console.log("growAge: ");
                  console.log(area.growAge);
                  startDate = new Date(area.growAge, 1, 1);
                  console.log("growAge year used:");
                  console.log(startDate);
                }
                else if(area.yearOfEstablishment !== undefined && area.yearOfEstablishment != null && area.yearOfEstablishment != ""){
                  startDate = new Date(area.yearOfEstablishment, 1, 1);
                  console.log("Establishment year used:");
                  console.log(startDate);
                }
                else{
                    //console.log("growAge: ");
                    //console.log("NONE");
                    startDate = new Date();
                }

                
                let nowDate = new Date();

                for (var i = plan.activities.length - 1; i >= 0; i--) {

                    //IMPORTANT: change ageYear and age_month to planned_date
                    //console.log(nowDate.getFullYear());
                    //console.log(startDate.getFullYear());
                    //console.log(plan.activities[i]['ageYear']); 
                    if(nowDate.getFullYear() - startDate.getFullYear() <= plan.activities[i]['ageYear'])
                    {
                        //console.log("Eligible to copy: ");

                        let	newDate = new Date(startDate.getFullYear()+plan.activities[i]['ageYear'], plan.activities[i]['ageMonth']-1);
                        let newActivity = plan.activities[i].toObject();

                            
                        newActivity['autoUpdate'] = true;
                        newActivity['scheduledDate'] = newDate;
                        newActivity['dateCompleted'] = newDate;
                        newActivity['areaId'] = area._id;
                        newActivity['createdAt'] = new Date();
                        newActivity['updatedAt'] = new Date();

                        ////console.log(newActivity);
                        

                        //console.log(plan.activities[i].method);
                        let percentage = plan.activities[i].percentage?plan.activities[i].percentage:100;
                        //console.log(method);

                        /* newActivity['meanQuantity'] =  [];
                        newActivity['meanTotalQuantity'] = 0;
                        newActivity['meanCost'] = 0;
                        //calculate product quantity
                        //calculate mean cost
                        if(plan.activities[i].activityType == 'spraying' || plan.activities[i].activityType == 'fertilizing'){
                            if(plan.activities[i].mean && plan.activities[i].mean.length > 0){
                                for (let j = 0; j < plan.activities[i].mean.length; j++) {
                                    const element = plan.activities[i].mean[j];
                                    if(plan.activities[i].methodUnit == "ha"){
                                        newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*area.areaSize*(percentage/100)).toFixed(3);
                                    } else if(plan.activities[i].methodUnit == "pcs"){
                                        newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*currentNumberOfTrees*(percentage/100)).toFixed(3);
                                    } else {
                                        newActivity['meanQuantity'][j] = 0;
                                    }
                                    newActivity['meanTotalQuantity'] += newActivity['meanQuantity'][j]*1;
                                    newActivity['meanCost'] += newActivity['meanQuantity'][j]*plan.activities[i].meanUnitPrice[j]
                                }
                            }
                        }
                        else if(plan.activities[i].activityType == 'planting'){
                            //type=plantning; the qty field= (10.000/(rowdistance xplantdistance)) x trackpercentage x area size
                            if(plan.activities[i].rowDistance > 0 && plan.activities[i].plantDistance > 0)
                                newActivity['meanTotalQuantity'] = (( (10000 / (plan.activities[i].rowDistance * plan.activities[i].plantDistance) ) * area.areaSize * (1 - plan.activities[i].trackPercentage/100))).toFixed(3);
                            else
                                newActivity['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(3);
                        }
                        else {
                            if(plan.activities[i].methodUnit == "ha")
                                newActivity['meanTotalQuantity'] = (area.areaSize*(percentage/100)).toFixed(3);
                            else if(plan.activities[i].methodUnit == "pcs")
                                newActivity['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(3);
                        }

                        //calculate machine cost
                        if(plan.activities[i].methodUnit == 'ha'){
                            //newActivity['machineCost'] = plan.activities[i].meanCost * area.areaSize * (percentage/100);
                            newActivity['machineCost'] = (plan.activities[i].methodUnitPrice * area.areaSize*(percentage/100)).toFixed(3);
                            if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                newActivity['hoursSpent'] = area.areaSize * (percentage/100) / plan.activities[i].methodUnitsPerHour;
                        }else if(plan.activities[i].methodUnit == 'pcs'){
                            newActivity['machineCost'] = (plan.activities[i].methodUnitPrice * currentNumberOfTrees*(percentage/100)).toFixed(3);
                            if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                newActivity['hoursSpent'] = currentNumberOfTrees*(percentage/100) / plan.activities[i].methodUnitsPerHour;
                        }
                        
                        //calculate total cost
                        newActivity['totalCost'] = newActivity['meanCost']*1 + newActivity['machineCost']*1; */


                        console.log("New activity Copied");

                        if(newActivity['_id'])
                            delete newActivity['_id'];
                        if(newActivity['planId'])
                            delete newActivity['planId'];

                        ////console.log(newActivity);
                        //area.activities.push(plan.activities[i]);
                        await Factory.models.activity(newActivity)
                        .save().then(async(copiedActivity)=>{
                            console.log("saved activity")
                            /* push activity to area */
                            await Factory.models.area.findOneAndUpdate(
                                { _id: req.body.areaId },
                                { "$push": { "activities": copiedActivity._id } }
                            ).then((updatedArea)=>{
                                console.log("pushed to area")
                            }, function (err) {
                                console.log(err)
                                console.log('error pushing to area')
                            });
                        }, function(err){
                            console.log("error occured")
                            console.log(err)
                        });

                        
                    }
                    
                }
            }, function (err){
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong.')
                    }))
                }
            }).then(async function(){
                await Factory.helpers.recalculateAllActivitiesCost(req.body.areaId)

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Plan copied'),
                    data: {}
                }))
            })
                
                
            
        })
    }
    /**
     * Copy planned activities to all areas
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @description It uses {@link InventorySchema} and {@link ActivitySchema} to calculate quantity and cost
     * @todo Merge it with {@link copyPlanActivities}
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.
     */
    copyPlanActivitiesToAllAreas(req, res){
        req.checkBody('planId', 'planId is required').required();

        console.log("COPYING GROW STRATEGY:");

        req.getValidationResult().then(async(result)=>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.area.find({userMysqlId: req.USER_MYSQL_ID})
            .populate('activities')
            .then(async(allAreas)=>{
              
                let plan = await Factory.models.growthPlan.findOne({_id: req.body.planId}).populate('activities').exec();

                for (let areaIndex = 0; areaIndex < allAreas.length; areaIndex++) 
                {
                    let singleArea = allAreas[areaIndex];

                    
                    /* //console.log(plan); */

                    console.log(singleArea);
                    let allActivities = await Factory.models.activity.find({areaId: singleArea._id}).exec();
                    //area.activities.toObject();
                    console.log(allActivities);
                    let currentNumberOfTrees = 0;
                    for (var i = 0; i < allActivities.length; i++) {
                        console.log(allActivities[i].status);

                        if(allActivities[i].status == "Plan" || allActivities[i].status == "Plannd")
                        {
                            console.log("DELETING");
                            await Factory.models.activity.findOneAndRemove({_id: allActivities[i]._id}).exec();
                            //singleArea.activities.splice(singleArea.activities.indexOf(allActivities[i]._id), 1);
                            console.log("DELETED");
                        } else {
                            if(new Date(allActivities[i].dateCompleted).getTime() <= (new Date()).getTime()){
                                if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                                    currentNumberOfTrees -= allActivities[i].meanTotalQuantity*1;
                                else if(allActivities[i].activityType == 'planting')
                                    currentNumberOfTrees += allActivities[i].meanTotalQuantity*1;
                            }
                        }
                    }
                    //singleArea.save();

                    let startDate;

                    if(singleArea.growAge !== undefined && singleArea.growAge != null && singleArea.growAge != ""){
                    console.log("growAge: ");
                    console.log(singleArea.growAge);
                    startDate = new Date(singleArea.growAge, 1, 1);
                    console.log("growAge year used:");
                    console.log(startDate);
                    }
                    else if(singleArea.yearOfEstablishment !== undefined && singleArea.yearOfEstablishment != null && singleArea.yearOfEstablishment != ""){
                    startDate = new Date(singleArea.yearOfEstablishment, 1, 1);
                    console.log("Establishment year used:");
                    console.log(startDate);
                    }
                    else{
                        //console.log("growAge: ");
                        //console.log("NONE");
                        startDate = new Date();
                    }

                    
                    let nowDate = new Date();

                    for (var i = plan.activities.length - 1; i >= 0; i--) 
                    {

                        //IMPORTANT: change ageYear and age_month to planned_date
                        //console.log(nowDate.getFullYear());
                        //console.log(startDate.getFullYear());
                        //console.log(plan.activities[i]['ageYear']); 
                        if(nowDate.getFullYear() - startDate.getFullYear() <= plan.activities[i]['ageYear'])
                        {
                            //console.log("Eligible to copy: ");

                            let	newDate = new Date(startDate.getFullYear()+plan.activities[i]['ageYear'], plan.activities[i]['ageMonth']-1);
                            let newActivity = plan.activities[i].toObject();

                            newActivity['autoUpdate'] = true;
                            newActivity['scheduledDate'] = newDate;
                            newActivity['dateCompleted'] = newDate;
                            newActivity['areaId'] = singleArea._id;
                            newActivity['createdAt'] = new Date();
                            newActivity['updatedAt'] = new Date();

                            ////console.log(newActivity);
                            
                            //console.log(plan.activities[i].method);
                            let percentage = plan.activities[i].percentage?plan.activities[i].percentage:100;
                            /* newActivity['meanQuantity'] =  [];
                            newActivity['meanTotalQuantity'] = 0;
                            newActivity['meanCost'] = 0;
                            //calculate product quantity
                            //calculate mean cost
                            if(plan.activities[i].activityType == 'spraying' || plan.activities[i].activityType == 'fertilizing'){
                                if(plan.activities[i].mean && plan.activities[i].mean.length > 0){
                                    for (let j = 0; j < plan.activities[i].mean.length; j++) {
                                        const element = plan.activities[i].mean[j];
                                        if(plan.activities[i].methodUnit == "ha"){
                                            newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*singleArea.areaSize*(percentage/100)).toFixed(3);
                                        } else if(plan.activities[i].methodUnit == "pcs"){
                                            newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*currentNumberOfTrees*(percentage/100)).toFixed(3);
                                        } else {
                                            newActivity['meanQuantity'][j] = 0;
                                        }
                                        newActivity['meanTotalQuantity'] += newActivity['meanQuantity'][j]*1;
                                        newActivity['meanCost'] += newActivity['meanQuantity'][j]*plan.activities[i].meanUnitPrice[j]
                                    }
                                }
                            }
                            else if(plan.activities[i].activityType == 'planting'){
                                //type=plantning; the qty field= (10.000/(rowdistance xplantdistance)) x trackpercentage x area size
                                if(plan.activities[i].rowDistance > 0 && plan.activities[i].plantDistance > 0)
                                        newActivity['meanTotalQuantity'] = (( (10000 / (plan.activities[i].rowDistance * plan.activities[i].plantDistance) ) * singleArea.areaSize * (1 - plan.activities[i].trackPercentage/100))).toFixed(3);
                                    else
                                        newActivity['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(3);
                            }
                            else {
                                if(plan.activities[i].methodUnit == "ha")
                                    newActivity['meanTotalQuantity'] = (singleArea.areaSize*(percentage/100)).toFixed(3);
                                else if(plan.activities[i].methodUnit == "pcs")
                                    newActivity['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(3);
                            }
                            //calculate machine cost
                            if(plan.activities[i].methodUnit == 'ha'){
                                //newActivity['machineCost'] = plan.activities[i].meanCost * area.areaSize * (percentage/100);
                                newActivity['machineCost'] = (plan.activities[i].methodUnitPrice * singleArea.areaSize*(percentage/100)).toFixed(3);
                                if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                    newActivity['hoursSpent'] = singleArea.areaSize * (percentage/100) / plan.activities[i].methodUnitsPerHour;
                            }else if(plan.activities[i].methodUnit == 'pcs'){
                                newActivity['machineCost'] = (plan.activities[i].methodUnitPrice * currentNumberOfTrees*(percentage/100)).toFixed(3);
                                if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                    newActivity['hoursSpent'] = currentNumberOfTrees*(percentage/100) / plan.activities[i].methodUnitsPerHour;
                            }
                            
                            //calculate total cost
                            newActivity['totalCost'] = newActivity['meanCost']*1 + newActivity['machineCost']*1; */

                            console.log("New Copied Activity: ");
                            console.log(newActivity);
                            // console.log('here is the machineCost: '+newActivity['machineCost']);
                            // console.log('here is the quantity: '+newActivity['quantity']);
                            // console.log('here is the total cost: '+newActivity['totalcost']);
                            /*if(plan.activities[i].mean){
                                //console.log(plan.activities[i].mean);
                                let mean = await Factory.models.inventory.populate(plan.activities[i], {path: 'mean'});
                                newActivity['meanCost'] = mean.uniPrice * mean.quantity;
                            }*/

                            if(newActivity['_id'])
                                delete newActivity['_id'];
                            if(newActivity['planId'])
                                delete newActivity['planId'];

                            ////console.log(newActivity);
                            //area.activities.push(plan.activities[i]);
                            await Factory.models.activity(newActivity)
                            .save().then(async(copiedActivity)=>{

                                /* push activity to area */
                                await Factory.models.area.findOneAndUpdate(
                                    { _id: singleArea._id },
                                    { "$push": { "activities": copiedActivity._id } }
                                ).then((updatedArea)=>{
                                    console.log("pushed to area")
                                }, function (err) {
                                    console.log(err)
                                    console.log('error pushing to area')
                                });
                                /* await Factory.models.area.findOne({_id: req.body.areaId})
                                .exec(async(err, newArea)=>{
                                    newArea.activities.push(copiedActivity._id);
                                    newArea.save();
                                }) */
                            }, function(err){
                                console.log("error occured")
                                console.log(err)
                            });   
                        }
                    }
                    await Factory.helpers.recalculateAllActivitiesCost(singleArea._id)
                }
            
            }, function (err){
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong.')
                    }))
                }
            }).then(function(){
                //await Factory.helpers.recalculateAllActivitiesCost(req.body.areaId)

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Plan copied'),
                    data: {}
                }))
            })
        })
    }
    /**
     * Copy single planned activity to an areas
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @param {String} areaId {@link AreaSchema}._id
     * @description It uses {@link InventorySchema} and {@link ActivitySchema} to calculate quantity and cost
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.
     */
    copySinglePlanActivity(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('areaId', 'areaId is required').required();

        console.log("COPYING SINGLE GROW STRATEGY:");

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

                let activity = await Factory.models.activity.findOne({_id: req.body.activityId}).exec();
                console.log(activity);

                //console.log(area);
                let allActivities = await Factory.models.activity.find({areaId: req.body.areaId}).exec();
                //area.activities.toObject();
                console.log(allActivities);
                for (var i = 0; i < allActivities.length; i++) {
                    console.log(allActivities[i].status);

                    if(allActivities[i].status == "Plan" || allActivities[i].status == "Plannd")
                    {
                        console.log("DELETING");
                        await Factory.models.activity.findOneAndRemove({_id: allActivities[i]._id}).exec();
                        //area.activities.splice(area.activities.indexOf(allActivities[i]._id), 1);
                        console.log("DELETED");
                    }
                }
                //area.save();

                let startDate;

                if(area.growAge !== undefined && area.growAge != null && area.growAge != ""){
                  console.log("growAge: ");
                  console.log(area.growAge);
                  startDate = new Date(area.growAge, 1, 1);
                  console.log("growAge year used:");
                  console.log(startDate);
                }
                else if(area.yearOfEstablishment !== undefined && area.yearOfEstablishment != null && area.yearOfEstablishment != ""){
                  startDate = new Date(area.yearOfEstablishment, 1, 1);
                  console.log("Establishment year used:");
                  console.log(startDate);
                }
                else{
                    //console.log("growAge: ");
                    //console.log("NONE");
                    startDate = new Date();
                }

                
                let nowDate = new Date();

                

                    //IMPORTANT: change ageYear and age_month to planned_date
                    //console.log(nowDate.getFullYear());
                    //console.log(startDate.getFullYear());
                    //console.log(activity['ageYear']); 
                    if(nowDate.getFullYear() - startDate.getFullYear() <= activity['ageYear'])
                    {
                        //console.log("Eligible to copy: ");

                        let	newDate = new Date(startDate.getFullYear()+activity['ageYear'], activity['ageMonth']-1);
                        let newActivity = activity.toObject();
                        
                        newActivity['autoUpdate'] = true;
                        newActivity['scheduledDate'] = newDate;
                        newActivity['dateCompleted'] = newDate;
                        newActivity['areaId'] = area._id;
                        newActivity['createdAt'] = new Date();
                        newActivity['updatedAt'] = new Date();

                        ////console.log(newActivity);
                        

                        //console.log(activity.method);
                        let percentage = activity.percentage?activity.percentage:100;
                        newActivity['meanQuantity'] =  [];
                        newActivity['meanTotalQuantity'] = 0;
                        newActivity['meanCost'] = 0;
                        //calculate product quantity
                        //calculate mean cost
                        if(plan.activities[i].activityType == 'spraying' || plan.activities[i].activityType == 'fertilizing'){
                            if(plan.activities[i].mean && plan.activities[i].mean.length > 0){
                                for (let j = 0; j < plan.activities[i].mean.length; j++) {
                                    const element = plan.activities[i].mean[j];
                                    if(plan.activities[i].methodUnit == "ha"){
                                        newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*area.areaSize*(percentage/100)).toFixed(3);
                                    } else if(plan.activities[i].methodUnit == "pcs"){
                                        newActivity['meanQuantity'][j] = (plan.activities[i].meanDose[j]*area.numberOfTrees*(percentage/100)).toFixed(2);
                                    } else {
                                        newActivity['meanQuantity'][j] = 0;
                                    }
                                    newActivity['meanTotalQuantity'] += newActivity['meanQuantity'][j]*1;
                                    newActivity['meanCost'] += newActivity['meanQuantity'][j]*plan.activities[i].meanUnitPrice[j]
                                }
                            }
                        }
                        else if(plan.activities[i].activityType == 'planting'){
                            //type=plantning; the qty field= (10.000/(rowdistance xplantdistance)) x trackpercentage x area size
                            if(plan.activities[i].rowDistance > 0 && plan.activities[i].plantDistance > 0)
                                newActivity['meanTotalQuantity'] = Math.round(( (10000 / (plan.activities[i].rowDistance * plan.activities[i].plantDistance) ) * area.areaSize * (1 - plan.activities[i].trackPercentage/100)));
                            else
                                newActivity['meanTotalQuantity'] = Math.round(area.numberOfTrees*(percentage/100));
                        }
                        else {
                            if(plan.activities[i].methodUnit == "ha")
                                newActivity['meanTotalQuantity'] = Math.round(area.areaSize*(percentage/100));
                            else if(plan.activities[i].methodUnit == "pcs")
                                newActivity['meanTotalQuantity'] = Math.round(area.numberOfTrees*(percentage/100));
                        }
                        //calculate machine cost
                        if(plan.activities[i].methodUnit == 'ha'){
                            //newActivity['machineCost'] = plan.activities[i].meanCost * area.areaSize * (percentage/100);
                            newActivity['machineCost'] = Math.round(plan.activities[i].methodUnitPrice * area.areaSize*(percentage/100));
                            if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                newActivity['hoursSpent'] = area.areaSize * (percentage/100) / plan.activities[i].methodUnitsPerHour;
                        }else if(plan.activities[i].methodUnit == 'pcs'){
                            newActivity['machineCost'] = Math.round(plan.activities[i].methodUnitPrice * area.numberOfTrees*(percentage/100));
                            if(plan.activities[i].methodUnitsPerHour && plan.activities[i].methodUnitsPerHour > 0)
                                newActivity['hoursSpent'] = area.numberOfTrees*(percentage/100) / plan.activities[i].methodUnitsPerHour;
                        }
                        
                        //calculate total cost
                        newActivity['totalCost'] = newActivity['meanCost'] * newActivity['machineCost'];


                        console.log("New Copied Activity: ");
                        console.log(newActivity);
                        // console.log('here is the machineCost: '+newActivity['machineCost']);
                        // console.log('here is the quantity: '+newActivity['quantity']);
                        // console.log('here is the total cost: '+newActivity['totalcost']);
                        /*if(plan.activities[i].mean){
                            //console.log(plan.activities[i].mean);
                            let mean = await Factory.models.inventory.populate(plan.activities[i], {path: 'mean'});
                            newActivity['meanCost'] = mean.uniPrice * mean.quantity;
                        }*/

                        if(newActivity['_id'])
                            delete newActivity['_id'];
                        if(newActivity['planId'])
                            delete newActivity['planId'];

                        ////console.log(newActivity);
                        //area.activities.push(plan.activities[i]);
                        await Factory.models.activity(newActivity)
                        .save(async(err, copiedActivity)=>{
                            if(err)
                                console.log(err);

                            /* push activity to area */
                            Factory.models.area.findOneAndUpdate(
                                { _id: req.body.areaId },
                                { "$push": { "activities": copiedActivity._id } }
                            ).exec(async(err, updatedArea)=>{
                                if(err){
                                    console.log(err);
                                }
                            });
                            /* await Factory.models.area.findOne({_id: req.body.areaId})
                            .exec(async(err, newArea)=>{
                                newArea.activities.push(copiedActivity._id);
                                newArea.save();
                            }) */
                        });

                        
                    }
                    

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Plan copied'),
                    data: {}
                }))
                
            })
        })
    }
    /**
     * Copy single planned activity to an other plan
     * @function
     * @param {String} planId {@link GrowthPlanSchema}._id
     * @param {String} activityId {@link ActivitySchema}._id
     * @description It populates {@link InventorySchema} and {@link MethodSchema}
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.
     */
    copySinglePlanActivityToPlan(req, res){
      req.checkBody('activityId', 'activityId is required').required();
      req.checkBody('planId', 'planId is required').required();

      console.log("COPYING SINGLE GROW STRATEGY To Plan:");

      req.getValidationResult().then(async(result)=>{
        if(!result.isEmpty()){
            return res.send(Factory.helpers.prepareResponse({
                success: false,
                message: req.__(result.array()[0].msg)
            }))
        }

        let activity = await Factory.models.activity.findOne({_id: req.body.activityId}).exec();
        let newActivity = activity.toObject();
        //console.log(newActivity);

        if(newActivity['_id'])
          delete newActivity['_id'];
        console.log(newActivity);

        newActivity['planId'] = req.body.planId;

        ////console.log(newActivity);
        //area.activities.push(plan.activities[i]);
        await Factory.models.activity(newActivity)
        .save(async(err, copiedActivity)=>{
            if(err){
                console.log(err);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Error finding activities.')
                }))
            }
            console.log(copiedActivity);
            /* push activity to growthplan */
            Factory.models.growthPlan.findOneAndUpdate(
                { _id: req.body.planId },
                { "$push": { "activities": copiedActivity._id } }
            ).exec(async(err, updatedArea)=>{
                if(err){
                    console.log(err);
                }
            });

            Factory.models.activity.findOne({_id: copiedActivity._id})
            .populate('mean')
            .exec(async(err, result)=>{
                if(err){
                    //console.log(err);
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }
                //console.log(activitiesMap);
                ////console.log(Factory.helpers.groupBy(result, activity=>activity.activityType));
                return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Plan copied'),
                        data: result
                    }));
            });

            /* return res.send(Factory.helpers.prepareResponse({
                message: req.__('Plan copied'),
                data: copiedActivity
            })); */
        });

      });
    }
}

module.exports = GrowthPlansController