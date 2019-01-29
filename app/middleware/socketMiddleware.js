let jwt = require('jsonwebtoken'),
Factory = require('../util/factory');

module.exports = (socket, next) => {
    let token = socket.handshake.query.token;
    if (token) {
        jwt.verify(token, new Buffer(Factory.env.JWT_SECRET, 'base64'), (err, decoded) => {
            if (err) {
                console.log(err);
                return next(new Error('Invalid token'));
            }
            else {
                Factory.models.user.findOne({_id: decoded._id}, async(error, user) => {
                    if (error) {
                        console.log(error);
                        return next(new Error('Something went wrong, try later'));
                    }
                    if (user) {
                        socket.USER_PASSWORD = user.password;
                        socket.USER_PRIVATE_LOCKER_PASSWORD = user.privateLockerPassword;
                        socket.USER_FINGERPRINT = user.fingerprint;
                        socket.USER_VERIFICATION_CODE = user.verificationCode;
                        socket.USER_EMAIL_VERIFICATION_CODE = user.emailVerificationCode;
                        socket.USER_FOLLOWING = user.following;
                        socket.USER_FOLLOWERS = user.followers;
                        socket.USER_FRIENDS = user.friends;
                        req.USER_MATCHES = user.matches;
                        socket.USER = await Factory.helpers.setDefaultValues(user.toObject());
                        Factory.redisClient.sadd([`${socket.USER._id}`, socket.id], (err, reply) => {
                            if (err) {
                                console.log(err);
                                next(new Error('Something went wrong, try later'));
                            }
                            else {
                                next();
                            }
                        });
                    }
                    else {
                        next(new Error('Invalid token'));
                    }
                });
            }
        });
    }
    else {
        return next(new Error('Token not provided'));
    }
};