let Factory = require('../../../util/factory');

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
            contractors: {
                $in: thisUserStaffIds
            }
        }
        Factory.models.activity.find(where)
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
            Factory.models.activity.findOne({_id: req.body.activityId}).populate('contractors').exec(async (err, activity)=>{
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
                if(activity.userMysqlId != req.USER_MYSQL_ID)
                    tasksWhere.userMysqlId = req.USER_MYSQL_ID;
                

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
        req.checkBody('activityId', 'activityId is required').required()
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
                meanQuantity: (req.body.meanQuantity) ? req.body.meanQuantity : [],
                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                notes: (req.body.notes) ? req.body.notes : '',
                status: (req.body.status) ? req.body.status : '',
                hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                startTime: (req.body.startTime) ? req.body.startTime : '',
                endTime: (req.body.endTime) ? req.body.endTime : '',

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
                dateCompleted: (req.body.dateCompleted) ? new Date((new Date(req.body.dateCompleted)).getTime() + (12*60*60*1000)) : '',
                notes: (req.body.notes) ? req.body.notes : '',
                status: (req.body.status) ? req.body.status : '',
                hoursSpent: (req.body.hoursSpent) ? req.body.hoursSpent : '',
                startTime: (req.body.startTime) ? req.body.startTime : '',
                endTime: (req.body.endTime) ? req.body.endTime : '',

                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }
            Factory.models.task.findOneAndUpdate({_id: req.body.taskId}, task, async(err, newTask) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with creating task functionality.'),
                        extras: err
                    }))
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
}

module.exports = SharedWorkController