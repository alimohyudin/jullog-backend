let Factory = require('../../../util/factory');

class NotificationController{
    getNotifications(req, res){
        //not coming here?
        let where = {
            toUserMysqlId: req.USER_MYSQL_ID,
            status: {
                $in: ['not-seen', 'seen']
            }
        }
        Factory.models.notification.find(where)
        .sort({createdAt: -1})
        .exec((err, notifications) =>{
            if(err){
                console.error(err);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__("Something went wrong, try later"),
                    extras: err
                }));
            }
            where.status = {$in: ['not-seen']};
            //Factory.models.notification.findAndUpdate(where, {status: 'seen'});
            
            /* let bulkOp = Factory.models.notification.collection.initializeOrderedBulkOp();

            bulkOp.find(where).update({ $set: {status: 'seen'}});
            bulkOp.execute( function (err){
                if(err)
                    console.error(err);
            }); */

            return res.send(Factory.helpers.prepareResponse({
                success: true,
                message: req.__("Notifications found"),
                data: {
                    notifications: notifications
                }
            }));
        })
    }
    
    ignoreNotification(req, res){
        req.checkBody('notificationId', 'notificationId is required').required()
        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }
            Factory.models.notification.findOneAndUpdate({_id: req.body.notificationId}, {status: 'ignore'}, async(err, updatedNotification) => {
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong with updating notification functionality.'),
                        extras: err
                    }))
                }
                return res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: req.__("Notification updated!"),
                    data: {
                    }
                }));
            });
        });
    }
}

module.exports = NotificationController