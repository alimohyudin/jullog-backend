let Factory = require('../../util/factory');

module.exports = class BasicNotifier {

    constructor(event, message) {
        this.event = event;
        this.message = message;
        //this.notify = this.notify.bind(this);
        this.notifyUser = this.notifyUser.bind(this);
        //this.notifyFollowers = this.notifyFollowers.bind(this);
        this.notifyTargetSockets = this.notifyTargetSockets.bind(this);
    }

    notifyUser(userMysqlId, notification) {
        let that = this;
        Factory.redisClient.smembers(`${userMysqlId}`, (error, sockets) => {
            if (error) {
                console.log(error);
            }
            else {
                that.notifyTargetSockets(sockets, notification);
            }
        });
        /* Factory.models.friend.where({$or: [{user: user._id}, {friend: user._id}]})
        .and({status: 'friends'})
        .select('_id user friend')
        .lean(true)
        .exec((err, friends) => {
            if (err) {
                console.log(err);
            }
            else if (friends.length > 0) {
                let friendId = '';
                for (let index in friends) {
                    if (friends[index].user==user._id) {
                        friendId = friends[index].friend;
                    }
                    else {
                        friendId = friends[index].user;
                    }
                    Factory.redisClient.smembers(`${friendId}`, (error, sockets) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            that.notifyTargetSockets(sockets, story);
                        }
                    });
                }
            }
        }); */
    }

    notifyTargetSockets(sockets, notification) {
        if (sockets) {
            if (sockets.length > 0) {
                let targetSocket = null;
                for (let sindex in sockets) {
                    targetSocket = Factory.socketIO.clients().connected[sockets[sindex]];
                    if (targetSocket) {
                        targetSocket.emit(this.event, Factory.helpers.prepareResponse({
                            message: this.message,
                            data: notification
                        }));
                    }
                }
            }
        }
    }
}