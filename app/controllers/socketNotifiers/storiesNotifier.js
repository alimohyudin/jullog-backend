let Factory = require('../../util/factory');

module.exports = class StoriesNotifier {

    constructor(event, message) {
        this.event = event;
        this.message = message;
        this.notify = this.notify.bind(this);
        this.notifyFriends = this.notifyFriends.bind(this);
        this.notifyFollowers = this.notifyFollowers.bind(this);
        this.notifyTargetSockets = this.notifyTargetSockets.bind(this);
    }

    notify(user, story) {
        if (story.privacy=='public' || story.privacy=='friends') {
            this.notifyFriends(user, story);
        }
        if (story.privacy=='public' || story.privacy=='followers') {
            this.notifyFollowers(user, story);
        }
    }

    notifyFriends(user, story) {
        let that = this;
        Factory.models.friend.where({$or: [{user: user._id}, {friend: user._id}]})
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
        });
    }

    notifyFollowers(user, story) {
        let that = this;
        Factory.models.follow.where({following: user._id})
        .select('_id follower')
        .lean(true)
        .exec((err, followers) => {
            if (err) {
                console.log(err);
            }
            else if (followers.length > 0) {
                let followerId = '';
                for (let index in followers) {
                    if (followers[index].user==user._id) {
                        followerId = followers[index].friend;
                    }
                    else {
                        followerId = followers[index].user;
                    }
                    Factory.redisClient.smembers(`${followerId}`, (error, sockets) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            that.notifyTargetSockets(sockets, story);
                        }
                    });
                }
            }
        });
    }

    notifyTargetSockets(sockets, story) {
        if (sockets) {
            if (sockets.length > 0) {
                let targetSocket = null;
                for (let sindex in sockets) {
                    targetSocket = Factory.socketIO.clients().connected[sockets[sindex]];
                    if (targetSocket) {
                        targetSocket.emit(this.event, Factory.helpers.prepareResponse({
                            message: this.message,
                            data: story
                        }));
                    }
                }
            }
        }
    }

}