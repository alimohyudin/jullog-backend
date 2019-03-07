let jwt = require('jsonwebtoken'),
Factory = require('../util/factory');

module.exports = {
    auth: (req, res, next) => {
        let token = req.body.token || req.query.token;
        if (!token) {
            if (req.headers.authorization) {
                token = req.headers.authorization.replace(/bearer /ig, '');
            }
        }
        if (token) {
            jwt.verify(token, new Buffer(Factory.env.JWT_SECRET), (err, decoded) => {
                if (err) {
                    return res.send(Factory.helpers.prepareResponse({message: req.__('Invalid token'), success: false}));
                }
                else {
                    //console.log(decoded);
                    if(decoded.id !== undefined && decoded.name !== undefined && decoded.email !== undefined){
                        req.USER_MYSQL_ID = decoded.id;
                        req.USER_NAME = decoded.name;
                        req.USER_EMAIL = decoded.email;
                        req.PACKAGE = decoded.package;
                        req.ALLOWED_AREAS = decoded.allowed_areas;
                        req.VAT_NUMBER = decoded.vat_number;
                        //Factory.logger.info(req.USER_MYSQL_ID);
                        next();
                    }
                    else
                    {
                        return res.send(Factory.helpers.prepareResponse({message: req.__('Invalid token'), success: false}));
                    }
                    
                    
                    /* Factory.models.user.findOne({_id: decoded._id}, 
                    async(err, user) => {
                        if (err) {
                            console.log(err);
                            return res.send(Factory.helpers.prepareResponse({message: req.__('Something went wrong, try later'), success: false}));
                        }
                        if (user) {
                            req.USER_PASSWORD = user.password;
                            req.USER_PRIVATE_LOCKER_PASSWORD = user.privateLockerPassword;
                            req.USER_FINGERPRINT = user.fingerprint;
                            req.USER_VERIFICATION_CODE = user.verificationCode;
                            req.USER_EMAIL_VERIFICATION_CODE = user.emailVerificationCode;
                            req.USER_FOLLOWING = user.following;
                            req.USER_FOLLOWERS = user.followers;
                            req.USER_FRIENDS = user.friends;
                            req.USER_MATCHES = user.matches;
                            req.USER_LIKED_STORIES = user.likedStories;
                            req.USER_LIKED_POSTS = user.likedPosts;
                            req.USER = await Factory.helpers.setDefaultValues(user.toObject());
                            next();
                        }
                        else {
                            return res.send(Factory.helpers.prepareResponse({message: req.__('Invalid token'), success: false}));
                        }
                    }); */
                }
            });
        }
        else {
            return res.send(Factory.helpers.prepareResponse({message: req.__('Token not provided'), success: false}));
        }
    },
    logger: function(req, res, next) {
        console.log("coming in logger")
        var oldWrite = res.write,
            oldEnd = res.end;

        var chunks = [];

        res.write = function (chunk) {
            chunks.push(chunk);

            oldWrite.apply(res, arguments);
        };

        res.end = function (chunk) {
            if (chunk)
            chunks.push(chunk);

            var body = Buffer.concat(chunks).toString('utf8');
            console.log(req.path, body);

            oldEnd.apply(res, arguments);
        };

        next();
    },
    errorLoggingWinston: function(err, req, res, next) {
        // Factory.logger.error(`${a} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {USER_MYSQL_ID: req.USER_MYSQL_ID});
        Factory.logger.log({
                level: 'error',
                message: `${err.message} - ${req.originalUrl} - ${req.method}`,
                meta: {
                    userMysqlId: req.USER_MYSQL_ID,
                    status: err.status || 500,
                    url: req.originalUrl,
                    method: req.method,
                    ip: req.ip
                }
            });
        // render the error page
        res.send(Factory.helpers.prepareResponse({
            success: false,
            message: req.__('Something went wrong, try later'),
        }));
    },
};