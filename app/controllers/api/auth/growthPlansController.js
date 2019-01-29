let Factory = require('../../../util/factory');

module.exports = class GrowthPlansController {

    constructor() {}

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

                    /* push activity to area */
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

                    /* plan.activities.push(newActivity._id);
                    plan.save(async(err, updatedPlan) => {
                        if(err){
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Area for this activity is not updated.'),
                            }))
                        }

                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Activity Created!'),
                            data: newActivity,
                        }));
                    }) */
                })
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
          .populate('method')
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
            .populate('method')
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
            /*Factory.models.activity.aggregate(aggregation)
            .exec(async(err, result)=>{
                if(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: 'Error finding activities.'
                    }))
                if(result){
                    Factory.models.inventory.populate(result, {path: 'activities.mean'}, async(err, meanPopulatedResult) =>{
                        if(meanPopulatedResult){
                            Factory.models.method.populate(meanPopulatedResult, {path: 'activities.method'}, async(err, methodPopulatedResult) => {
                                if(methodPopulatedResult){
                                    return res.send(Factory.helpers.prepareResponse({
                                        message: req.__('Activities data.'),
                                        data: methodPopulatedResult
                                    }));
                                }
                            });
                        }
                    });
                }
                
            });*/
        });
        
    }

    copyPlanActivities(req, res){
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
            .populate('activities')
            .exec(async(err, area)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('something went wrong.')
                    }))
                }

                let plan = await Factory.models.growthPlan.findOne({_id: req.body.planId}).populate('activities').exec();
                /* //console.log(plan);

                //console.log(area); */
                let allActivities = await Factory.models.activity.find({areaId: req.body.areaId}).exec();
                //area.activities.toObject();
                //console.log(allActivities);
                console.log("Area Activities...")
                for (var i = 0; i < allActivities.length; i++) {
                    console.log("id: "+allActivities[i]._id)
                    console.log(allActivities[i].status);

                    if(allActivities[i].status == "Plan" || allActivities[i].status == "Plannd")
                    {
                        await Factory.models.activity.findOneAndRemove({_id: allActivities[i]._id}).exec();
                        area.activities.splice(area.activities.indexOf(allActivities[i]._id), 1);
                        console.log("DELETED");
                    }
                }
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

                        newActivity['scheduledDate'] = newDate;
                        newActivity['dateCompleted'] = newDate;
                        newActivity['areaId'] = area._id;
                        newActivity['createdAt'] = new Date();
                        newActivity['updatedAt'] = new Date();

                        ////console.log(newActivity);
                        

                        if(plan.activities[i].method){
                            //console.log(plan.activities[i].method);
                            let percentage = plan.activities[i].percentage?plan.activities[i].percentage:100;
                            let method = await Factory.models.method.findOne({_id: plan.activities[i].method}).exec();
                            //console.log(method);
                            if(method.methodUnit == 'ha'){
                                newActivity['unitPrice2'] = method.unitPrice * area.areaSize * (percentage/100);
                                if(method.unitsPerHour && method.unitsPerHour > 0)
                                  newActivity['hoursSpent'] = area.areaSize * (percentage/100) / method.unitsPerHour;
                            }else if(method.methodUnit == 'pcs'){
                                newActivity['unitPrice2'] = method.unitPrice * area.numberOfTrees * (percentage/100);
                                if(method.unitsPerHour && method.unitsPerHour > 0)
                                  newActivity['hoursSpent'] = area.numberOfTrees*(percentage/100) / method.unitsPerHour;
                            }
                            if(plan.activities[i].dose){
                                console.log("Dose: "+plan.activities[i].dose);
                                console.log("method: "+method);
                                //newActivity['quantity'] = plan.activities[i].dose * area.areaSize;
                                if(plan.activities[i].activityType == 'spraying' || plan.activities[i].activityType == 'fertilizing'){
                                    if(method.methodUnit == "ha"){
                                        newActivity['quantity'] = plan.activities[i].dose * area.areaSize*(percentage/100);
                                        console.log("Percentage: "+percentage);
                                        console.log("Area: "+area.areaSize);
                                        console.log("Quantity: "+newActivity['quantity']);
                                    }
                                    else if(method.methodUnit == "pcs")
                                        newActivity['quantity'] = plan.activities[i].dose * area.numberOfTrees*(percentage/100);
                                }
                            }else{
                                //alert(area.numberOfTrees);
                                console.log("Dose not found: ")
                                if(method.methodUnit == "ha")
                                    newActivity['quantity'] =  area.areaSize * (percentage/100);
                                else if(method.methodUnit == "pcs")
                                    newActivity['quantity'] = area.numberOfTrees * (percentage/100);
                            }

                            newActivity['totalCost'] = method.unitPrice * newActivity['quantity'] * (percentage/100);


                        }

                        console.log("New activity Copied");
                        //console.log(newActivity);
                        // console.log('here is the unitPrice2: '+newActivity['unitPrice2']);
                        // console.log('here is the quantity: '+newActivity['quantity']);
                        // console.log('here is the total cost: '+newActivity['totalcost']);
                        /*if(plan.activities[i].mean){
                            //console.log(plan.activities[i].mean);
                            let mean = await Factory.models.inventory.populate(plan.activities[i], {path: 'mean'});
                            newActivity['unitPrice'] = mean.uniPrice * mean.quantity;
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
                    
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Plan copied'),
                    data: {}
                }))
                
            })
        })
    }

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
          .exec(async(err, allAreas)=>{
              if(err){
                  return res.send(Factory.helpers.prepareResponse({
                      success: false,
                      message: req.__('something went wrong.')
                  }))
              }
              
              let plan = await Factory.models.growthPlan.findOne({_id: req.body.planId}).populate('activities').exec();

              for (let areaIndex = 0; areaIndex < allAreas.length; areaIndex++) {
                let singleArea = allAreas[areaIndex];

                
                /* //console.log(plan); */

                console.log(singleArea);
                let allActivities = await Factory.models.activity.find({areaId: singleArea._id}).exec();
                //area.activities.toObject();
                console.log(allActivities);
                for (var i = 0; i < allActivities.length; i++) {
                    console.log(allActivities[i].status);

                    if(allActivities[i].status == "Plan" || allActivities[i].status == "Plannd")
                    {
                        console.log("DELETING");
                        await Factory.models.activity.findOneAndRemove({_id: allActivities[i]._id}).exec();
                        singleArea.activities.splice(singleArea.activities.indexOf(allActivities[i]._id), 1);
                        console.log("DELETED");
                    }
                }
                singleArea.save();

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

                    newActivity['scheduledDate'] = newDate;
                    newActivity['dateCompleted'] = newDate;
                    newActivity['areaId'] = singleArea._id;
                    newActivity['createdAt'] = new Date();
                    newActivity['updatedAt'] = new Date();

                    ////console.log(newActivity);
                    

                    if(plan.activities[i].method){
                        //console.log(plan.activities[i].method);
                        let percentage = plan.activities[i].percentage?plan.activities[i].percentage:100;
                        let method = await Factory.models.method.findOne({_id: plan.activities[i].method}).exec();
                        //console.log(method);
                        if(method.methodUnit == 'ha'){
                            newActivity['unitPrice2'] = method.unitPrice * singleArea.areaSize * (percentage/100);
                            if(method.unitsPerHour && method.unitsPerHour > 0)
                              newActivity['hoursSpent'] = singleArea.areaSize * (percentage/100) / method.unitsPerHour;
                        }else if(method.methodUnit == 'pcs'){
                            newActivity['unitPrice2'] = method.unitPrice * singleArea.numberOfTrees * (percentage/100);
                            if(method.unitsPerHour && method.unitsPerHour > 0)
                              newActivity['hoursSpent'] = singleArea.numberOfTrees*(percentage/100) / method.unitsPerHour;
                        }
                        if(plan.activities[i].dose){
                            console.log("Dose: "+plan.activities[i].dose);
                            console.log("method: "+method);
                            //newActivity['quantity'] = plan.activities[i].dose * singleArea.areaSize;
                            if(plan.activities[i].activityType == 'spraying' || plan.activities[i].activityType == 'fertilizing'){
                                if(method.methodUnit == "ha"){
                                    newActivity['quantity'] = plan.activities[i].dose * singleArea.areaSize*(percentage/100);
                                    console.log("Percentage: "+percentage);
                                    console.log("Area: "+singleArea.areaSize);
                                    console.log("Quantity: "+newActivity['quantity']);
                                }
                                else if(method.methodUnit == "pcs")
                                    newActivity['quantity'] = plan.activities[i].dose * singleArea.numberOfTrees*(percentage/100);
                            }
                        }else{
                            //alert(area.numberOfTrees);
                            if(method.methodUnit == "ha")
                                newActivity['quantity'] =  singleArea.areaSize * (percentage/100);
                            else if(method.methodUnit == "pcs")
                                newActivity['quantity'] = singleArea.numberOfTrees * (percentage/100);
                        }

                        newActivity['totalCost'] = method.unitPrice * newActivity['quantity'] * (percentage/100);


                    }

                    console.log("New Copied Activity: ");
                    console.log(newActivity);
                    // console.log('here is the unitPrice2: '+newActivity['unitPrice2']);
                    // console.log('here is the quantity: '+newActivity['quantity']);
                    // console.log('here is the total cost: '+newActivity['totalcost']);
                    /*if(plan.activities[i].mean){
                        //console.log(plan.activities[i].mean);
                        let mean = await Factory.models.inventory.populate(plan.activities[i], {path: 'mean'});
                        newActivity['unitPrice'] = mean.uniPrice * mean.quantity;
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
                            { _id: singleArea._id },
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
                }
              }

              return res.send(Factory.helpers.prepareResponse({
                  message: req.__('Plan copied'),
                  data: {}
              }))
              
          })
      })
  }
    
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
                        area.activities.splice(area.activities.indexOf(allActivities[i]._id), 1);
                        console.log("DELETED");
                    }
                }
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

                

                    //IMPORTANT: change ageYear and age_month to planned_date
                    //console.log(nowDate.getFullYear());
                    //console.log(startDate.getFullYear());
                    //console.log(activity['ageYear']); 
                    if(nowDate.getFullYear() - startDate.getFullYear() <= activity['ageYear'])
                    {
                        //console.log("Eligible to copy: ");

                        let	newDate = new Date(startDate.getFullYear()+activity['ageYear'], activity['ageMonth']-1);
                        let newActivity = activity.toObject();

                        newActivity['scheduledDate'] = newDate;
                        newActivity['dateCompleted'] = newDate;
                        newActivity['areaId'] = area._id;
                        newActivity['createdAt'] = new Date();
                        newActivity['updatedAt'] = new Date();

                        ////console.log(newActivity);
                        

                        if(activity.method){
                            //console.log(activity.method);
                            let percentage = activity.percentage?activity.percentage:100;
                            let method = await Factory.models.method.findOne({_id: activity.method}).exec();
                            //console.log(method);
                            if(method.methodUnit == 'ha'){
                                newActivity['unitPrice2'] = method.unitPrice * area.areaSize * (percentage/100);
                                if(method.unitsPerHour && method.unitsPerHour > 0)
                                  newActivity['hoursSpent'] = area.areaSize * (percentage/100) / method.unitsPerHour;
                            }else if(method.methodUnit == 'pcs'){
                                newActivity['unitPrice2'] = method.unitPrice * area.numberOfTrees * (percentage/100);
                                if(method.unitsPerHour && method.unitsPerHour > 0)
                                  newActivity['hoursSpent'] = area.numberOfTrees*(percentage/100) / method.unitsPerHour;
                            }
                            if(activity.dose){
                                console.log("Dose: "+activity.dose);
                                console.log("method: "+method);
                                //newActivity['quantity'] = activity.dose * area.areaSize;
                                if(activity.activityType == 'spraying' || activity.activityType == 'fertilizing'){
                                    if(method.methodUnit == "ha"){
                                        newActivity['quantity'] = activity.dose * area.areaSize*(percentage/100);
                                        console.log("Percentage: "+percentage);
                                        console.log("Area: "+area.areaSize);
                                        console.log("Quantity: "+newActivity['quantity']);
                                    }
                                    else if(method.methodUnit == "pcs")
                                        newActivity['quantity'] = activity.dose * area.numberOfTrees*(percentage/100);
                                }
                            }else{
                                //alert(area.numberOfTrees);
                                if(method.methodUnit == "ha")
                                    newActivity['quantity'] =  area.areaSize * (percentage/100);
                                else if(method.methodUnit == "pcs")
                                    newActivity['quantity'] = area.numberOfTrees * (percentage/100);
                            }

                            newActivity['totalCost'] = method.unitPrice * newActivity['quantity'] * (percentage/100);


                        }

                        console.log("New Copied Activity: ");
                        console.log(newActivity);
                        // console.log('here is the unitPrice2: '+newActivity['unitPrice2']);
                        // console.log('here is the quantity: '+newActivity['quantity']);
                        // console.log('here is the total cost: '+newActivity['totalcost']);
                        /*if(plan.activities[i].mean){
                            //console.log(plan.activities[i].mean);
                            let mean = await Factory.models.inventory.populate(plan.activities[i], {path: 'mean'});
                            newActivity['unitPrice'] = mean.uniPrice * mean.quantity;
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
            .populate('method')
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