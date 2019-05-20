let Factory = require('../../util/factory'),
StoriesListener = require('./storiesListener');

module.exports = class ConnectionListener {

    constructor() {
        this.connected = this.connected.bind(this);
    }

    connected(socket) {
        console.log("connected socket")
        socket.emit('connected', Factory.helpers.prepareResponse({
            message: "connection successful",
            data: socket.USER
        }));

        /* let storiesListener = new StoriesListener();
        socket.on('storiesFromFriends', storiesListener.storiesFromFriends); */

        socket.on('error', this.disconnected);
        socket.on('disconnect', this.disconnected);
    }

    disconnected() {
        Factory.redisClient.srem([`${this.USER.USER_MYSQL_ID}`, this.id], (err, reply) => {
            if (err) {
                console.log(err);
            }
        });
    }
}