let Factory = require('../../../util/factory');

module.exports = class ActivityMethodsController {

    constructor() {}

    createMethod(req, res){
        req.checkBody('name', 'name is required.').required();
        req.checkBody('activityType', 'activityType is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty())
            {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            let method = {
                userMysqlId: req.USER_MYSQL_ID,
                userMysqlType: (req.body.userMysqlType) ? req.body.userMysqlType : 'customer',
                name: req.body.name,
                type: req.body.type,
                activityType: req.body.activityType,
                
                methodUnit: (req.body.methodUnit) ? req.body.methodUnit : '',
                unitsPerHour: (req.body.unitsPerHour) ? req.body.unitsPerHour : '',
                unitPrice: (req.body.unitPrice) ? req.body.unitPrice : '',
                notes: (req.body.notes) ? req.body.notes : '',
                
                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.method(method)
            .save((err, method) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("problem creating new method")
                    }))
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("method created successfully."),
                    data: method
                }))
            })
        });
    }

    deleteMethod(req, res){
        req.checkBody('methodId', 'methodId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.method.findOneAndRemove({_id: req.body.methodId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__("Method deleted")
                    }));
                }
            })

        });
    }

    getMethods(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        if(req.body.activityType)
            where = {userMysqlId: req.USER_MYSQL_ID, activityType: req.body.activityType};

        Factory.models.method.find(where)
        .exec((err, methods) => {
            if(err){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__("error retrieving method")
                }))
            }
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Method(s) found'),
                data: methods
            }))
        })
    }

    editMethod(req, res){
        req.checkBody('methodId', 'methodId is required').required();
        req.checkBody('name', 'name is required.').required();
        req.checkBody('activityType', 'activityType is required.').required();

        //console.log(req.body);

        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }
            let method = {
                name: req.body.name,
                type: req.body.type,
                activityType: req.body.activityType,
                
                methodUnit: (req.body.methodUnit) ? req.body.methodUnit : '',
                unitsPerHour: (req.body.unitsPerHour) ? req.body.unitsPerHour : '',
                unitPrice: (req.body.unitPrice) ? req.body.unitPrice : '',
                notes: (req.body.notes) ? req.body.notes : '',
                
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.method.findOneAndUpdate({_id: req.body.methodId}, method, function(err, deletedNoted){
                if (err) {
                    console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later")
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__("Method updated")
                    }));
                }
            })

        });
    }
}