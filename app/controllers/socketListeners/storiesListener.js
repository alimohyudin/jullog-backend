let Factory = require('../../util/factory');

module.exports = class StoriesListener {

    constructor() {}

    static async setMediaPath(stories) {
        if (stories.length > 0) {
            for (let s in stories) {
                if (stories[s].media.length > 0) {
                    for (let index in stories[s].media) {
                        if (typeof stories[s].media[index]=='object') {
                            stories[s].media[index].path = await Factory.helpers.url(stories[s].media[index].path);
                        }
                    }
                }
                stories[s].user.profilePhoto = await Factory.helpers.url(stories[s].user.profilePhoto, true);
            }
        }
        return stories;
    }

    static error(socket, event, message) {
        socket.emit(event, Factory.helpers.prepareResponse({
            success: false,
            message: message
        }));
    }

    storiesFromFriends() {
        if (this.USER_FRIENDS.length <= 0) {
            return this.emit('storiesFromFriends', Factory.helpers.prepareResponse({
                message: "Stories from friends",
                data: {
                    stories: []
                }
            }));
        }
        let storyDate = new Date();
        storyDate.setDate(storyDate.getDate() - 1); // subtract 24 (1 day) hours from date
        Factory.models.story.where({
            user: {$in: this.USER_FRIENDS},
            createdAt: {$gte: storyDate}
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, stories) => {
            if (error) {
                console.log(err);
                this.emit('storiesFromFriends', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                this.emit('storiesFromFriends', Factory.helpers.prepareResponse({
                    message: "Stories from friends",
                    data: {
                        stories: await StoriesListener.setMediaPath(stories)
                    }
                }));
            }
        });
    }

    storiesFromFollowings() {
        if (this.USER_FOLLOWING.length <= 0) {
            return this.emit('storiesFromFollowings', Factory.helpers.prepareResponse({
                message: "Stories from followings",
                data: {
                    stories: []
                }
            }));
        }
        let storyDate = new Date();
        storyDate.setDate(storyDate.getDate() - 1); // subtract 24 (1 day) hours from date
        Factory.models.story.where({
            user: {$in: this.USER_FOLLOWING},
            createdAt: {$gte: storyDate}
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, stories) => {
            if (error) {
                console.log(err);
                this.emit('storiesFromFollowings', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                this.emit('storiesFromFollowings', Factory.helpers.prepareResponse({
                    message: "Stories from followings",
                    data: {
                        stories: await StoriesListener.setMediaPath(stories)
                    }
                }));
            }
        });
    }

    storiesFromMatches() {
        if (this.USER_MATCHES.length <= 0) {
            return this.emit('storiesFromMatches', Factory.helpers.prepareResponse({
                message: "Stories from matches",
                data: {
                    stories: []
                }
            }));
        }
        let storyDate = new Date();
        storyDate.setDate(storyDate.getDate() - 1); // subtract 24 (1 day) hours from date
        Factory.models.story.where({
            user: {$in: (this.USER_MATCHES) ? this.USER_MATCHES:[]},
            createdAt: {$gte: storyDate}
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, stories) => {
            if (error) {
                console.log(err);
                this.emit('storiesFromMatches', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                this.emit('storiesFromMatches', Factory.helpers.prepareResponse({
                    message: "Stories from matches",
                    data: {
                        stories: await StoriesListener.setMediaPath(stories)
                    }
                }));
            }
        });
    }

    viewedStory() {
        // increase view count of story and emit socket event
        Factory.models.story.where({
            _id: this._id,
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, story) => {
            if (error) {
                console.log(err);
                this.emit('viewedStory', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                if (story.views.indexOf(this.USER._id) < 0) {
                    story.views.push(this.USER._id);
                    story.save(async(serr) => {
                        if (serr) {
                            console.log(serr);
                            this.emit('viewedStory', Factory.helpers.prepareResponse({
                                message: "Something went wrong, try later",
                            }));
                        }
                        else {
                            // notify to all related users about view
                            this.emit('viewedStory', Factory.helpers.prepareResponse({
                                message: "Story viewed",
                                data: {
                                    story: await StoriesListener.setMediaPath([story])
                                }
                            }));
                        }
                    });
                }
            }
        });
    }

    likedStory(data) {
        // increase like count of story and emit socket event
        if (!data) {
            return StoriesListener.error(this, 'likedStory', 'No story selected');
        }
        if (!Factory.validators.required(data._id) || !Factory.validators.isObjectId(data._id)) {
            return StoriesListener.error(this, 'likedStory', 'Selected story is invalid');
        }
        Factory.models.story.where({
            _id: data._id,
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, story) => {
            if (error) {
                console.log(err);
                return StoriesListener.error(this, 'likedStory', 'Something went wrong, try later');
            }
            else {
                if (story.likes.indexOf(this.USER._id) < 0) {
                    story.likes.push(this.USER._id);
                    story.save(async(serr) => {
                        if (serr) {
                            console.log(serr);
                            return StoriesListener.error(this, 'likedStory', 'Something went wrong, try later');
                        }
                        else {
                            // notify to all related users about view
                            this.emit('likedStory', Factory.helpers.prepareResponse({
                                message: "Story liked",
                                data: {
                                    story: await StoriesListener.setMediaPath([story])
                                }
                            }));
                        }
                    });
                }
                else {
                    this.emit('likedStory', Factory.helpers.prepareResponse({
                        message: "Story already liked",
                        data: {
                            story: await StoriesListener.setMediaPath([story])
                        }
                    }));
                }
            }
        });
    }

    happyForStory(data) {
        // increase happy count of story and emit socket event
        if (!data) {
            return StoriesListener.error(this, 'happyForStory', 'No story selected');
        }
        if (!Factory.validators.required(data._id) || !Factory.validators.isObjectId(data._id)) {
            return StoriesListener.error(this, 'happyForStory', 'Selected story is invalid');
        }
        Factory.models.story.where({
            _id: this._id,
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, story) => {
            if (error) {
                console.log(err);
                return StoriesListener.error(this, 'happyForStory', 'Something went wrong, try later');
            }
            else {
                if (story.happy.indexOf(this.USER._id) < 0) {
                    story.happy.push(this.USER._id);
                    story.angry.pull(this.USER._id);
                    story.save(async(serr) => {
                        if (serr) {
                            console.log(serr);
                            return StoriesListener.error(this, 'happyForStory', 'Something went wrong, try later');
                        }
                        else {
                            // notify to all related users about view
                            this.emit('happyForStory', Factory.helpers.prepareResponse({
                                message: "Saved",
                                data: {
                                    story: await StoriesListener.setMediaPath([story])
                                }
                            }));
                        }
                    });
                }
                else {
                    this.emit('happyForStory', Factory.helpers.prepareResponse({
                        message: "Already saved",
                        data: {
                            story: await StoriesListener.setMediaPath([story])
                        }
                    }));
                }
            }
        });
    }

    angryForStory(data) {
        // increase angry count of story and emit socket event
        if (!data) {
            return StoriesListener.error(this, 'angryForStory', 'No story selected');
        }
        if (!Factory.validators.required(data._id) || !Factory.validators.isObjectId(data._id)) {
            return StoriesListener.error(this, 'angryForStory', 'Selected story is invalid');
        }
        Factory.models.story.where({
            _id: this._id,
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, story) => {
            if (error) {
                console.log(err);
                this.emit('angryForStory', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                if (story.angry.indexOf(this.USER._id) < 0) {
                    story.angry.push(this.USER._id);
                    story.happy.pull(this.USER._id);
                    story.save(async(serr) => {
                        if (serr) {
                            console.log(serr);
                            return StoriesListener.error(this, 'angryForStory', 'Something went wrong, try later');
                        }
                        else {
                            // notify to all related users about view
                            this.emit('angryForStory', Factory.helpers.prepareResponse({
                                message: "Saved",
                                data: {
                                    story: await StoriesListener.setMediaPath([story])
                                }
                            }));
                        }
                    });
                }
                else {
                    this.emit('angryForStory', Factory.helpers.prepareResponse({
                        message: "Already saved",
                        data: {
                            story: await StoriesListener.setMediaPath([story])
                        }
                    }));
                }
            }
        });
    }

    commentedOnStory(data) {
        // increase comment count of story and emit socket event
        if (!data) {
            return StoriesListener.error(this, 'commentedOnStory', 'No story selected');
        }
        if (!Factory.validators.required(data.story) || !Factory.validators.isObjectId(data.story)) {
            return StoriesListener.error(this, 'commentedOnStory', 'Selected story is invalid');
        }
        if (data.comment) {
            if (!Factory.validators.required(data.comment)) {
                return StoriesListener.error(this, 'commentedOnStory', 'Comment is required');
            }
        }
        else {
            
        }
        // comment: {type: String, required: true, default: ''},
        // media: {path: {type: String, default: ''}, mimetype: {type: String, default: ''}},
        Factory.models.story.where({
            _id: this._id,
        })
        .populate({path: 'user', select: '_id userName profilePhoto'})
        .exec(async(error, story) => {
            if (error) {
                console.log(err);
                this.emit('angryForStory', Factory.helpers.prepareResponse({
                    success: false,
                    message: "Something went wrong, try later"
                }));
            }
            else {
                if (story.angry.indexOf(this.USER._id) < 0) {
                    story.angry.push(this.USER._id);
                    story.happy.pull(this.USER._id);
                    story.save(async(serr) => {
                        if (serr) {
                            console.log(serr);
                            this.emit('angryForStory', Factory.helpers.prepareResponse({
                                message: "Something went wrong, try later",
                            }));
                        }
                        else {
                            // notify to all related users about view
                            this.emit('angryForStory', Factory.helpers.prepareResponse({
                                message: "Saved",
                                data: {
                                    story: await StoriesListener.setMediaPath([story])
                                }
                            }));
                        }
                    });
                }
                else {
                    this.emit('angryForStory', Factory.helpers.prepareResponse({
                        message: "Already saved",
                        data: {
                            story: await StoriesListener.setMediaPath([story])
                        }
                    }));
                }
            }
        });
    }

}