let Factory = require('../../util/factory');

module.exports = class NotificationListener {

    constructor() {}

    getNotifications() {
        let where = {
            toUserMysqlId: this.USER.USER_MYSQL_ID,
            status: {
                $in: ['not-seen', 'seen']
            }
        }
        Factory.models.notification.find(where)
        .exec((err, notifications) =>{
            if(err){
                console.error(err);
                return this.emit('notifications', Factory.helpers.prepareResponse({
                    message: "notifications",
                    data: {
                        notifications: []
                    }
                }));
            }

            return this.emit('notifications', Factory.helpers.prepareResponse({
                message: "notifications",
                data: {
                    notifications: notifications
                }
            }));
        })
    }
    updateNotificationsToSeen(){
        let where = {
            toUserMysqlId: this.USER.USER_MYSQL_ID,
            status: 'not-seen',
        }
        console.log(where)
        console.log("this mothafoka");
        let bulkOp = Factory.models.notification.collection.initializeOrderedBulkOp();

        bulkOp.find(where).update({ $set: {status: 'seen'}});
        bulkOp.execute( function (err){
            if(err)
                console.error(err);
        });
        //return this.getNotifications();
        return true;
    }
}