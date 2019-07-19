let Factory = require('../../../util/factory');
let BasicNotifier = require('../../socketNotifiers/basicNotifiers');

class StaffController {
    addUser(req, res){
        req.checkBody('name', 'name is required').required();
        req.checkBody('email', 'email is required').required();
        req.checkBody('staffMysqlId', 'staffMysqlId is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let alreadyExistsWhere = {
                userMysqlId: req.USER_MYSQL_ID,
                staffMysqlId: req.body.staffMysqlId, 
                request: {
                    $in: ['request-sent', 'accepted', 'blocked']
                }
            }

            let isAlreadyExist = await Factory.models.staff.find(alreadyExistsWhere).exec();
            if(isAlreadyExist.length <=0){
                let staff = {
                    userMysqlId: req.USER_MYSQL_ID,
                    ownerName: req.USER_NAME,
                
                    staffMysqlId: req.body.staffMysqlId,
                    name: req.body.name,
                    email: req.body.email,
                    request: 'request-sent',

                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                }
                Factory.models.staff(staff).save(async(err, newStaff) => {
                    if(err){
                        console.log(err)
                        return res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong with creating staff functionality.'),
                            extras: err
                        }))
                    }
                    //create a notification for newly added user
                    let notification = {
                        fromUserMysqlId: staff.userMysqlId,
                        toUserMysqlId: staff.staffMysqlId,
                        
                        title: 'Staff Request',
                        detail: staff.ownerName + ' requested you to become his/her staff member.',

                        featureName: 'staff-request',
                        featureId: newStaff._id,
                        
                        status: 'not-seen',
                    }
                    Factory.models.notification(notification).save(async(err, newNotification)=>{
                        let basicNotifier = new BasicNotifier('newNotification', 'newNotification');
                        basicNotifier.notifyUser(req.body.staffMysqlId, newNotification);
                    });
                    

                    return res.send(Factory.helpers.prepareResponse({
                        success: true,
                        message: req.__("user added!"),
                        data: {
                            staff: newStaff
                        }
                    }));
                })
            } else {
                let message = 'You cannot send request to this user';
                if(isAlreadyExist[0].request == 'request-sent')
                    message = 'Request already sent.'
                else if(isAlreadyExist[0].request == 'accepted')
                    message = 'This user is already in your staff.'
                
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(message),
                    data: {
                        staff: ''
                    }
                }));
            }
        });
    }
    removeUser(req, res){
        req.checkBody('staffId', 'staffId is required').required();
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            Factory.models.staff.findOneAndRemove({_id: req.body.staffId}, function(err, deletedStaff){
                if (err) {
                    console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('user removed'),
                    }));
                }
            })
        })
    }
    getStaff(req, res){
        let where = {
            userMysqlId: req.USER_MYSQL_ID
        }
        Factory.models.staff.find(where)
        .exec(async(err, staff) => {
            if (err) {
                console.log(err);
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__("Something went wrong, try later"),
                }));
            }
            
            res.send(Factory.helpers.prepareResponse({
                success: true,
                message: req.__("Staff found"),
                data: {
                    staff: staff,
                    pagination: [],
                },
            }));
        });
    }

    responseToStaffRequest(req, res){
        req.checkBody('notificationId', 'notificationId is required').required();
        req.checkBody('staffId', 'staffId is required').required();
        req.checkBody('acceptOrReject', 'acceptOrReject is required').required();
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            if(req.body.acceptOrReject == 'accept'){
                let notification = await Factory.models.notification.findOne({_id: req.body.notificationId}).exec();

                //create a notification for newly added user
                let newNotification = {
                    fromUserMysqlId: req.USER_MYSQL_ID,
                    toUserMysqlId: notification.fromUserMysqlId,
                    
                    title: 'Staff Request accepted',
                    detail: req.USER_NAME + ' accepted your request to become your staff member.',

                    featureName: 'staff-request-response',
                    featureId: notification.featureId,
                    
                    status: 'not-seen',
                }
                Factory.models.notification(newNotification).save(async(err, newNotification) => {
                    if(err){
                        console.log(err)
                    } else {
                        let basicNotifier = new BasicNotifier('newNotification', 'newNotification');
                        basicNotifier.notifyUser(newNotification.toUserMysqlId, newNotification);
                    }
                });
                
                Factory.models.notification.findOneAndRemove({_id: req.body.notificationId}).exec();
            } else {
                Factory.models.notification.findOneAndRemove({_id: req.body.notificationId}).exec();
            }

            await Factory.models.staff.findOneAndUpdate({_id: req.body.staffId}, {request: req.body.acceptOrReject});
            res.send(Factory.helpers.prepareResponse({
                success: true,
                message: req.__("Response sent!"),
                data: {
                },
            }));
        });
    }
}
module.exports = StaffController;