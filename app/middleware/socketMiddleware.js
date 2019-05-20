let jwt = require('jsonwebtoken'),
Factory = require('../util/factory');

module.exports = (socket, next) => {
    let token = socket.handshake.query.token;
    console.log("coming here... in socket middleware")
    if (token) {
        jwt.verify(token, new Buffer(Factory.env.JWT_SECRET), (err, decoded) => {
            if (err) {
                console.log(err);
                return next(new Error('Invalid token'));
            }
            else {
                if(decoded.id !== undefined && decoded.name !== undefined && decoded.email !== undefined){
                    socket.USER = {};
                    socket.USER.USER_MYSQL_ID = decoded.id;
                    socket.USER.USER_NAME = decoded.name;
                    socket.USER.USER_EMAIL = decoded.email;
                    socket.USER.PACKAGE = decoded.package;
                    socket.USER.ALLOWED_AREAS = decoded.allowed_areas;
                    socket.USER.VAT_NUMBER = decoded.vat_number;
                    Factory.redisClient.sadd([`${socket.USER.USER_MYSQL_ID}`, socket.id], (err, reply) => {
                        if (err) {
                            console.log(err);
                            next(new Error('Something went wrong, try later'));
                        }
                        else {
                            next();
                        }
                    });
                    next();
                }
                else {
                    next(new Error('Invalid token'));
                }
            }
        });
    }
    else {
        return next(new Error('Token not provided'));
    }
};