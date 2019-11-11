let Factory = require('../../../util/factory');

/**
 * AreaPropertyController
 * @class
 */
class AreaPropertyController {

    constructor() {
    }
    createProperty(req, res){
        req.checkBody('name', 'name field is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty())
            {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            let property = {
                userMysqlId: req.USER_MYSQL_ID,
                name: req.body.name,
                
                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.areaProperty(property)
            .save(async(err, property) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later")
                    }))
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("property created successfully."),
                    data: property
                }))
            })
        });
    }
    getProperties(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        let PER_PAGE_PROPERTIES = Factory.env.PER_PAGE.AREA_PROPERTIES;
        
        if(req.body.propertyId)
            where._id = req.body.propertyId;

        Factory.models.areaProperty.count(where, (err, count) => {
            let page = Math.abs(req.body.page);
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_PROPERTIES),
                per_page: PER_PAGE_PROPERTIES,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_PROPERTIES;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.areaProperty.find(where)
                .lean(true)
                .limit(PER_PAGE_PROPERTIES)
                .skip(skip)
                .exec(async(err, properties) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!properties || properties.length <= 0) {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No property found"),
                            data: {
                                properties: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("property(s) found"),
                            data: {
                                properties: properties,
                                pagination: pagination,
                            }
                        }));
                    }
                });
            }
            else {
                res.send(Factory.helpers.prepareResponse({
                    message: req.__("No property found"),
                    data: {
                        properties: [],
                        pagination: pagination
                    }
                }));
            }
        });
    }
    editProperty(req, res){
        req.checkBody('propertyId', 'propertyId is required').required();
        req.checkBody('name', 'name is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.areaProperty.findOne({_id: req.body.propertyId})
            .exec(async(err, property) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                property.name = req.body.name;
                property.updatedAt = new Date();
                
                property.save()
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("property updated!"),
                    data: property
                }))
            })
        });
    }
    deleteProperty(req, res){
        req.checkBody('propertyId', 'propertyId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.areaProperty.findOneAndRemove({_id: req.body.propertyId}, function(err, deleteNoted){
                if (err) {
                    console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    Factory.models.area.update(
                        {},
                        { $pull: 
                            { "properties":req.body.propertyId }
                        },
                        { multi: true }
                    );
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('property deleted'),
                    }));
                }
            })

        });
    }
}

module.exports = AreaPropertyController