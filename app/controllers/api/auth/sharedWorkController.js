let Factory = require('../../../util/factory');
let BasicNotifier = require('../../socketNotifiers/basicNotifiers');

class SharedWorkHelper{
    async updateActivityActualValues(task){
        if(task.activityId){
            let activity = await Factory.models.activity.findOne({_id: task.activityId}).exec();
            if(task.meanQuantity && task.meanQuantity != []){
                //have means
                let actualTotalCost = 0;
                for (let index = 0; index < activity.mean.length; index++) {
                    //const mean = activity.mean[index];
                    /**
                     * TODO: what if the mean is coming from staff and not from owner?
                     */
                    actualTotalCost += activity.meanUnitPrice[index] * task.meanQuantity[index];
                }
                
                let prevActualTotalCost = 0;
                if(activity.actualTotalCost && activity.actualTotalCost > 0)
                    prevActualTotalCost = activity.actualTotalCost;
                activity.actualTotalCost = prevActualTotalCost + actualTotalCost;
                
            } else if(task.otherQuantity && task.salePricePerUnit){
                let actualTotalCost = task.otherQuantity * task.salePricePerUnit;
                let actualHoursSpent = task.hoursSpent;

                let prevActualTotalCost = 0;
                if(activity.actualTotalCost && activity.actualTotalCost > 0)
                    prevActualTotalCost = activity.actualTotalCost;
                activity.actualTotalCost = prevActualTotalCost + actualTotalCost;
            }
            
            if(task.hoursSpent){
                let prevActualHoursSpent = 0;
                if(activity.actualHoursSpent && activity.actualHoursSpent > 0)
                    prevActualHoursSpent = activity.actualHoursSpent;
                activity.actualHoursSpent = prevActualHoursSpent + task.hoursSpent;
            }
            activity.save();
        }
    }
}

class SharedWorkController{
    async getSharedActivities(req, res){
        let thisUserStaffIds = [];
        //one user can be staff of multiple owners
        let ownedBy = await Factory.models.staff.find({staffMysqlId: req.USER_MYSQL_ID}).exec();
        for (let index = 0; index < ownedBy.length; index++) {
            const element = ownedBy[index];
            thisUserStaffIds.push(element._id);
        }

        let where = {
            $or:[
                {
                    contractors: {
                        $in: thisUserStaffIds
                    }
                },
                {
                    userMysqlId: req.USER_MYSQL_ID,
                    contractors: {
                        $exists: true,
                        $ne: []
                    }
                }
            ]
            
        }
        Factory.models.activity.find(where)
        .populate('areaId')
        .populate('contractors')
        .exec((err, activities) =>{
            if(err){
                console.error(err);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__("Something went wrong, try later"),
                    extras: err
                }));
            }
            return res.send(Factory.helpers.prepareResponse({
                success: true,
                message: req.__("Activities found"),
                data: {
                    sharedActivities: activities
                }
            }));
        })
    }

    getSharedActivityData(req, res){
        req.checkBody('activityId', 'activityId is required').required()
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            //for staff only populate his own information and not for other contractors
            Factory.models.activity.findOne({_id: req.body.activityId}).populate('areaId').populate('contractors').exec(async (err, activity)=>{
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with getting shared activity functionality.'),
                        extras: err
                    }))
                }
                let activityData = activity.toObject();
                
                //check if current user is staff or the owner of the activity
                //if owner bring all tasks
                //if staff bring only current user's tasks
                let tasksWhere = {
                    activityId: req.body.activityId
                };
                //if(activity.userMysqlId != req.USER_MYSQL_ID)
                //    tasksWhere.userMysqlId = req.USER_MYSQL_ID;
                

                activityData.taskData = await Factory.models.task.find(tasksWhere).exec();
                
                activityData.currentUserType = 'owner';
                if(activity.userMysqlId != req.USER_MYSQL_ID)
                {
                    activityData.currentUserType = 'staff';
                    //if user is a staff member
                    for (let index = 0; index < activityData.contractors.length; index++) {
                        const element = activityData.contractors[index];
                        if(element.staffMysqlId == req.USER_MYSQL_ID){
                            activityData.currentUserStaffInfo = element;
                            break;
                        }
                    }

                }

                return res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__('Found shared activity data.'),
                    data: activityData
                }))
            })
        });
    }

    createTask(req, res){
        req.checkBody('activityId', 'activityId is required').required();
        req.checkBody('activityType', 'activityType is required').required();
        req.checkBody('areaId', 'areaId is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            let task = {
                userMysqlId: req.USER_MYSQL_ID,
                staffId: (req.body.staffId) ? req.body.staffId : null,

                activityId: req.body.activityId,
                activityType: req.body.activityType,
                areaId: req.body.areaId,

                meanQuantity: (req.body.meanQuantity) ? req.body.meanQuantity : [],
                otherQuantity: (req.body.otherQuantity) ? req.body.otherQuantity : 0,
                salePricePerUnit: (req.body.salePricePerUnit) ? req.body.salePricePerUnit : 0,

                meanMapping: (req.body.meanMapping) ? req.body.meanMapping : [],
                deductQuantityFrom: (req.body.deductQuantityFrom) ? req.body.deductQuantityFrom : 'no-deduct',

                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                notes: (req.body.notes) ? req.body.notes : '',
                status: (req.body.status) ? req.body.status : '',
                hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                hourlyRate: (req.body.hourlyRate) ? req.body.hourlyRate : 0,
                
                weatherCondition: (req.body.weatherCondition) ? req.body.weatherCondition : '',
                wind: (req.body.wind) ? req.body.wind : '',
                temperature: (req.body.temperature) ? req.body.temperature : '',
                weather: (req.body.weather) ? req.body.weather : '',

                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }
            Factory.models.task(task).save(async(err, newTask) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating task functionality.'),
                        extras: err
                    }))
                }
                
                //create a notification for owner about newly created task by staff
                //if user is a staff member
                if(req.body.staffId)
                {
                    
                    Factory.models.activity.findOne({_id: req.body.activityId}).exec(async (err, activity)=>{
                        if(!err){
                            let notification = {
                                fromUserMysqlId: req.USER_MYSQL_ID,
                                toUserMysqlId: activity.userMysqlId,
                                
                                title: 'task-in-progress',
                                detail: activity.name+' is in-progress by a staff member.',
        
                                featureName: 'task-in-progress',
                                featureId: req.body.activityId,
                                
                                status: 'not-seen',
                            }
                            if(newTask.status == 'completed'){
                                notification.title = 'task-completed';
                                notification.detail = activity.name+' udført af '+req.USER_NAME;
                                notification.featureName = 'task-completed';
                            }

                            Factory.models.notification(notification).save(async(err, newNotification)=>{
                                if(err)
                                    console.log(err)
                                let basicNotifier = new BasicNotifier('newNotification', 'newNotification');
                                basicNotifier.notifyUser(notification.toUserMysqlId, newNotification);
                            });
                        }else{
                            console.log(err)
                        }
                    });
                    
                } else {
                    //its not staff
                    //deduct owner quantity if owner-deduct
                    if(newTask.deductQuantityFrom == 'owner-deduct'){
                        Factory.models.activity.findOne({_id: newTask.activityId})
                        .populate('mean')
                        .exec(async(err, activity) => {
                            if(err){
                                console.log(err)
                            }
                            else if(!activity.mean){
                                //"Mean doesn't exists."
                            }
                            else{
                                
                                for (let j = 0; j < activity.mean.length; j++) {
                                    const element = activity.mean[j];
                                    activity.mean[j].quantity = activity.mean[j].quantity*1 - newTask.meanQuantity[j]*1;
                                    activity.mean[j].save();
                                }
                                newTask.isQuantityDeducted = true;
                                newTask.save();
                            }
                        })
                    }
                    (new SharedWorkHelper()).updateActivityActualValues(newTask);
                }

                return res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__("Task created!"),
                    data: {
                        task: newTask
                    }
                }));
            });
        });
    }
    
    updateTask(req, res){
        req.checkBody('taskId', 'taskId is required').required()
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            let task = {
                meanQuantity: (req.body.meanQuantity) ? req.body.meanQuantity : [],
                otherQuantity: (req.body.otherQuantity) ? req.body.otherQuantity : 0,
                salePricePerUnit: (req.body.salePricePerUnit) ? req.body.salePricePerUnit : 0,
                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                notes: (req.body.notes) ? req.body.notes : '',
                status: (req.body.status) ? req.body.status : '',
                hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                hourlyRate: (req.body.hourlyRate) ? req.body.hourlyRate : 0,

                deductQuantityFrom: (req.body.deductQuantityFrom) ? req.body.deductQuantityFrom : 'no-deduct',
                
                weatherCondition: (req.body.weatherCondition) ? req.body.weatherCondition : '',
                wind: (req.body.wind) ? req.body.wind : '',
                temperature: (req.body.temperature) ? req.body.temperature : '',
                weather: (req.body.weather) ? req.body.weather : '',

                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }
            Factory.models.task.findOneAndUpdate({_id: req.body.taskId}, task, {new: true}, async(err, newTask) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating task functionality.'),
                        extras: err
                    }))
                }
                if(newTask.status == 'completed'){
                    Factory.models.activity.findOne({_id: newTask.activityId}).exec(async (err, activity)=>{
                        if(!err){
                            let notification = {
                                fromUserMysqlId: req.USER_MYSQL_ID,
                                toUserMysqlId: activity.userMysqlId,
                                
                                title: 'task-completed',
                                detail: 'Some work is completed by a staff member.',
        
                                featureName: 'task-completed',
                                featureId: newTask.activityId,
                                
                                status: 'not-seen',
                            }

                            Factory.models.notification(notification).save(async(err, newNotification)=>{
                                if(err)
                                    console.log(err)
                                let basicNotifier = new BasicNotifier('newNotification', 'newNotification');
                                basicNotifier.notifyUser(notification.toUserMysqlId, newNotification);
                            });
                        }else{
                            console.log(err)
                        }
                    });
                }

                return res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__("Task updated!"),
                    data: {
                        task: newTask
                    }
                }));
            });
        });
    }

    deleteTask(req, res){
        Factory.helpers.generalDeleteApi(req,res, 'task', 'taskId');
    }

    acceptRejectTask(req, res){
        req.checkBody('taskId', 'taskId is required').required();
        req.checkBody('type', 'type is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            let updatedField = {
                status: req.body.type
            }

            console.log(updatedField);
            // save
            Factory.models.task.findOneAndUpdate({_id: req.body.taskId}, updatedField, {new: true}, async(err, newTask) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating activity functionality.')
                    }))
                }

                let notification = {
                    fromUserMysqlId: req.USER_MYSQL_ID,
                    toUserMysqlId: newTask.userMysqlId,
                    
                    title: 'task-rejected',
                    detail: req.USER_NAME+' afviste arbejde. Kontroller venligst.',

                    featureName: 'task-rejected',
                    featureId: newTask.activityId,
                    
                    status: 'not-seen',
                };

                if(req.body.type == 'accepted'){
                    notification.title = 'task-accepted';
                    notification.detail = 'Ejer accepterede arbejdet';
                    notification.featureName= 'task-accepted';

                    /**
                     * Also deduct quantity
                     */
                    if(newTask.deductQuantityFrom == 'staff-deduct'){
                        newTask.isQuantityDeducted = true;
                        if(newTask.meanMapping != []){
                            let updatedMeansTask = await Factory.models.inventory.populate(newTask, {path: 'meanMapping'});
                            for (let j = 0; j < updatedMeansTask.meanMapping.length; j++) {
                                const element = updatedMeansTask.meanMapping[j];
                                updatedMeansTask.meanMapping[j].quantity = updatedMeansTask.meanMapping[j].quantity*1 - newTask.meanQuantity[j]*1;
                                await updatedMeansTask.meanMapping[j].save();
                            }
                        }
                        newTask.save();
                    } else if(newTask.deductQuantityFrom == 'owner-deduct'){
                        newTask.isQuantityDeducted = true;
                        newTask.save();
                        Factory.models.activity.findOne({_id: newTask.activityId})
                        .populate('mean')
                        .exec(async(err, activity) => {
                            if(err){
                                console.log(err)
                            }
                            else if(!activity.mean){
                                //"Mean doesn't exists."
                            }
                            else{
                                
                                for (let j = 0; j < activity.mean.length; j++) {
                                    const element = activity.mean[j];
                                    activity.mean[j].quantity = activity.mean[j].quantity*1 - newTask.meanQuantity[j]*1;
                                    activity.mean[j].save();
                                }
                            }
                        })
                    }

                    (new SharedWorkHelper()).updateActivityActualValues(newTask);
                }
                Factory.models.notification(notification).save(async(err, newNotification)=>{
                    if(err)
                        console.log(err)
                    let basicNotifier = new BasicNotifier('newNotification', 'newNotification');
                    basicNotifier.notifyUser(notification.toUserMysqlId, newNotification);
                });

                res.send(Factory.helpers.prepareResponse({
                    message: req.__('status Updated!'),
                    data: {
                        task: newTask
                    },
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
        req.checkBody('taskId', 'taskId is required').required();
        req.checkBody('meanIndex', 'mean index is required').required();
        req.checkBody('value', 'value is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.task.findOne({_id: req.body.taskId, deletedAt: null})
            .exec(async(err, task) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                if(task.meanJournalReported)
                    task.meanJournalReported[req.body.meanIndex] = (req.body.value == "true")?true:false;
                else{
                    task.meanJournalReported = Array.apply(null, Array(task.meanQuantity.length)).map(function() { return false });
                    task.meanJournalReported[req.body.meanIndex] = (req.body.value == "true")?true:false;
                }
                
                Factory.models.task.update({_id: req.body.taskId}, task, async(err, newTask) => {
                    if(err){
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating activity functionality.')
                        }))
                    }

                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Task Updated!'),
                        data: newTask,
                    }));
                })
            });
        })
    }
}

module.exports = SharedWorkController