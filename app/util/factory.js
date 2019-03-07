
module.exports = class Factory {

    set env(env) {
        Factory.env = env;
    }

    set helpers(helpers) {
        Factory.helpers = helpers;
    }

    set models(models) {
        Factory.models = models;
    }

    set socketIO(socketIO) {
        Factory.socketIO = socketIO;
    }

    set redisClient(redisClient) {
        Factory.redisClient = redisClient;
    }

    set validators(validators) {
        Factory.validators = validators;
    }

    set logger(logger) {
        Factory.logger = logger;
    }




    get env() {
        return Factory.env;
    }

    get helpers() {
        return Factory.helpers;
    }

    get models() {
        return Factory.models;
    }

    get socketIO() {
        return Factory.socketIO;
    }

    get redisClient() {
        return Factory.redisClient;
    }

    get validators() {
        return Factory.validators;
    }
    
    get logger() {
        return Factory.logger;
    }
}