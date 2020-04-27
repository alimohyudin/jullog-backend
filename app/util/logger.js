let Factory = require('./factory');
let express = require('express');
const expressWinston = require('express-winston');
const winston = require('winston'); 
require('winston-mongodb');

module.exports = {
    log: () =>{
        return new (winston.Logger)({
            transports: [
                new winston.transports.MongoDB({
                    db: 'mongodb://127.0.0.1:27017/tender-app',
                    collection: 'logger',
                    level: 'info',
                    storeHost: true,
                    capped: true,
                })
            ]
        });
    }
}