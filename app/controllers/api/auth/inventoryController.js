let Factory = require('../../../util/factory');

class InventoryHelper{
    async updateActivityProductUnitPrice(productId, value){
        /**
         * 1- find all activities that has mean with given _id with status plan
         * 2- find index of _id inside mean array of activity
         * 3- update meanUnitPrice[ index ] with given value
         */
        
        await Factory.models.activity.find({mean: productId, status: 'Plan'})
        .exec(async(err, activities) => {
            if(err){
                return -1;
            }
            for (let index = 0; index < activities.length; index++) {
                const element = activities[index];
                let indexOfProduct = element.mean.indexOf(productId);
                //activities[index].meanUnitPrice[indexOfProduct] = value;
                //await activities[index].save();
                let meanUnitPrice = activities[index].meanUnitPrice;
                meanUnitPrice[indexOfProduct] = value;
                console.log(element._id)
                await Factory.models.activity.findOneAndUpdate({_id: element._id}, { $set: {meanUnitPrice: meanUnitPrice}});
            }
            return 1;
        });
      }
}

/**
 * InventoryController
 * @class
 */
class InventoryController {

    constructor() {}
    /**
     * Creates new Product
     * @function
     * @param {String} productName
     * @param {String} type - [fertilizer, pesticide, material]
     * @param {InventorySchema} FormData
     * @description Creates Plan under a user referenced to Mysql Database using token.<br>
     * Field: req.USER_MYSQL_ID
     * If req.USER_MYSQL_ID == 1 then store userMysqlType: 'admin' for admin products to be separated
     * else 'customer'
     * @returns {PrepareResponse} Returns the Default response object. With `data` object having {@link InventorySchema}
     */
    createProduct(req, res){
        req.checkBody('name', 'name is required.').required();
        req.checkBody('type', 'type is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty())
            {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            let product = {
                userMysqlId: req.USER_MYSQL_ID,

                userMysqlType: (req.USER_MYSQL_ID==1) ? 'admin' : 'customer',

                name: req.body.name,
                type: req.body.type,

                registrationNumber: (req.body.registrationNumber) ? req.body.registrationNumber : '',
                quantity: (req.body.quantity) ? req.body.quantity : '',
                unit: (req.body.unit) ? req.body.unit : '',
                unitPrice: (req.body.unitPrice) ? req.body.unitPrice : '',
                treatmentUnit: (req.body.treatmentUnit) ? req.body.treatmentUnit : '',

                activeAgent: (req.body.activeAgent) ? req.body.activeAgent : '',
                supplier: (req.body.supplier) ? req.body.supplier : '',
                productLink: (req.body.productLink) ? req.body.productLink : '',

                nitrogen:(req.body.nitrogen)? req.body.nitrogen : null,
                phosphorus:(req.body.phosphorus)? req.body.phosphorus : null,
                potassium:(req.body.potassium)? req.body.potassium : null,
                calcium:(req.body.calcium)? req.body.calcium : null,
                magnesium:(req.body.magnesium)? req.body.magnesium : null,
                sodium:(req.body.sodium)? req.body.sodium : null,
                sulfur:(req.body.sulfur)? req.body.sulfur : null,
                boron:(req.body.boron)? req.body.boron : null,
                chlorine:(req.body.chlorine)? req.body.chlorine : null,
                copper:(req.body.copper)? req.body.copper : null,
                iron:(req.body.iron)? req.body.iron : null,
                manganese:(req.body.manganese)? req.body.manganese : null,
                molybdenum:(req.body.molybdenum)? req.body.molybdenum : null,
                zinc:(req.body.zinc)? req.body.zinc : null,
                
                density:(req.body.density)? req.body.density : null,
                
                createdAt: (req.body.createdAt) ? req.body.createdAt: new Date(),
                updatedAt: (req.body.updatedAt) ? req.body.updatedAt: new Date(),
            }

            Factory.models.inventory(product)
            .save(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later")
                    }))
                }

                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("product created successfully."),
                    data: product
                }))
            })
        });
    }
    /**
     * Delete Product
     * @function
     * @param {String} productId {@link InventorySchema}._id
     * @description Delete product
     * @todo and also handle linked activities to this product
     * @returns {PrepareResponse} Returns the Default response object.
     */
    deleteProduct(req, res){
        req.checkBody('productId', 'productId is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models.inventory.findOne({_id: req.body.productId})
            .exec(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }

                product.deletedAt = new Date();
                product.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product deleted"),
                    data: {}
                }))
            })

            /* Factory.models.inventory.findOneAndRemove({_id: req.body.productId}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__("Product deleted"),
                    }));
                }
            }) */

        });
    }
    /**
     * Get products with pagination
     * @function
     * @description Its using token to get userMysqlId stored in req.USER_MYSQL_ID.
     * @returns {PrepareResponse|InventorySchema|Pagination} Returns the Default response object.  With `data` object containing Products
     */
    getProducts(req, res){
        let where = {userMysqlId: req.USER_MYSQL_ID};
        let PER_PAGE_PRODUCTS = Factory.env.PER_PAGE.PRODUCTS;
        if(req.USER_MYSQL_ID == 1){
            PER_PAGE_PRODUCTS = Factory.env.PER_PAGE.ADMIN_PRODUCTS;
        }

        if(req.body.getAdminProducts == 1){
            
            where = {userMysqlId: 1};
            if(req.body.type && req.body.type !== ''){
              where.type = req.body.type;
            }
            PER_PAGE_PRODUCTS = 500;
        }
        else if(req.body.activityType){
            let productType = 'fertilizer';
            if(req.body.activityType == 'spraying'){
                productType = {$in: ['fertilizer', 'pesticide']}
            }
            //let productType = (req.body.activityType == 'fertilizing')?'fertilizer':'pesticide';
            
            where = {userMysqlId: req.USER_MYSQL_ID, type: productType};
            PER_PAGE_PRODUCTS = 500;
        }

        where.deletedAt = null;

        Factory.models.inventory.count(where, (err, count) => {
            let page = Math.abs(req.body.page);
            let pagination = {
                total: count,
                pages: Math.ceil(count / PER_PAGE_PRODUCTS),
                per_page: PER_PAGE_PRODUCTS,
                page: isNaN(page) ? 1:page,
            };
            if (pagination.page <= pagination.pages) {
                let skip = (pagination.page-1)*PER_PAGE_PRODUCTS;
                pagination.previous = pagination.page - 1;
                pagination.next = pagination.page + 1;
                Factory.models.inventory.find(where)
                .lean(true)
                .limit(PER_PAGE_PRODUCTS)
                .skip(skip)
                .exec(async(err, products) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    if (!products || products.length <= 0) {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("No product found"),
                            data: {
                                products: [],
                                pagination: pagination,
                            },
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: true,
                            message: req.__("Product(s) found"),
                            data: {
                                products: products,
                                pagination: pagination,
                            }
                        }));
                    }
                });
            }
            else {
                res.send(Factory.helpers.prepareResponse({
                    message: req.__("No product found"),
                    data: {
                        products: [],
                        pagination: pagination
                    }
                }));
            }
        });
    }
    /**
     * Update Product
     * @function
     * @param {InventorySchema} Form_Data
     * @param {String} ProductId {@link InventorySchema}._id
     * @param {String} type {@link InventorySchema}.type
     * @description update Product
     * @returns {PrepareResponse} Returns the Default response object.
     */
    editProduct(req, res){
        req.checkBody('productId', 'productId is required').required();
        req.checkBody('name', 'name is required.').required();
        req.checkBody('type', 'type is required.').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.inventory.findOne({_id: req.body.productId})
            .exec(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }

                product.name = req.body.name;
                product.type = req.body.type;
                product.registrationNumber = (req.body.registrationNumber) ? req.body.registrationNumber : '';
                product.quantity = (req.body.quantity) ? req.body.quantity : '';
                product.unit = (req.body.unit) ? req.body.unit : '';
                product.activeAgent = (req.body.activeAgent) ? req.body.activeAgent : '';
                product.supplier = (req.body.supplier) ? req.body.supplier : '';
                product.productLink = (req.body.productLink) ? req.body.productLink : '';
                product.updatedAt = (req.body.updatedAt) ? req.body.updatedAt: new Date();

                product.save()
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product quantity changed!"),
                    data: {}
                }))
            })
        });
    }
    /**
     * Update Product Nutrients
     * @function
     * @param {InventorySchema} Form_Data
     * @param {String} ProductId {@link InventorySchema}._id
     * @description update Product
     * @returns {PrepareResponse} Returns the Default response object.
     */
    editProductNutrients(req, res){
        req.checkBody('productId', 'productId is required').required();

        console.log(req.body);

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.inventory.findOne({_id: req.body.productId})
            .exec(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }
                product.nitrogen = (req.body.nitrogen)? req.body.nitrogen : null;
                product.phosphorus = (req.body.phosphorus)? req.body.phosphorus : null;
                product.potassium = (req.body.potassium)? req.body.potassium : null;
                product.calcium = (req.body.calcium)? req.body.calcium : null;
                product.magnesium = (req.body.magnesium)? req.body.magnesium : null;
                product.sodium = (req.body.sodium)? req.body.sodium : null;
                product.sulfur = (req.body.sulfur)? req.body.sulfur : null;
                product.boron = (req.body.boron)? req.body.boron : null;
                product.chlorine = (req.body.chlorine)? req.body.chlorine : null;
                product.copper = (req.body.copper)? req.body.copper : null;
                product.iron = (req.body.iron)? req.body.iron : null;
                product.manganese = (req.body.manganese)? req.body.manganese : null;
                product.molybdenum = (req.body.molybdenum)? req.body.molybdenum : null;
                product.zinc = (req.body.zinc)? req.body.zinc : null;
                
                product.density = (req.body.density)? req.body.density : null;
                
                product.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product quantity changed!"),
                    data: {}
                }))
            })
        });
    }
    /**
     * Update Product quantity
     * @function
     * @param {String} ProductId {@link InventorySchema}._id
     * @param {Number} Quantity {@link InventorySchema}.quantity
     * @description update Product quantity
     * @todo Change to updateProductField() and getProductFieldValue() to reduce other functions
     * @returns {PrepareResponse} Returns the Default response object.
     */
    editProductQuantity(req, res){
        req.checkBody('productId', 'productId is required').required();
        req.checkBody('quantity', 'quantity is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.inventory.findOne({_id: req.body.productId})
            .exec(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }

                product.quantity = req.body.quantity;
                product.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product quantity changed!"),
                    data: {}
                }))
            })
        });
    }
    /**
     * Update Product unitPrice
     * @function
     * @param {String} ProductId {@link InventorySchema}._id
     * @param {Number} UnitPrice {@link InventorySchema}.unitPrice
     * @description update Product unitPrice
     * @todo Change to updateProductField() and getProductFieldValue() to reduce other functions
     * @returns {PrepareResponse} Returns the Default response object.
     */
    editProductUnitPrice(req, res){
        req.checkBody('productId', 'productId is required').required();
        req.checkBody('unitPrice', 'unitPrice is required').required();

        req.getValidationResult().then(async(result) => {
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            Factory.models.inventory.findOne({_id: req.body.productId})
            .exec(async(err, product) => {
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: err
                    }))
                }

                product.unitPrice = req.body.unitPrice;
                product.save();

                await (new InventoryHelper()).updateActivityProductUnitPrice(req.body.productId, req.body.unitPrice);
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product unitPrice changed!"),
                    data: {}
                }))
            })
        });
    }
    /**
     * Get expenditures overview with pagination
     * @function
     * @param {Date} [fromDate] {@link ActivitySchema}.dateCompleted
     * @param {Date} [toDate] {@link ActivitySchema}.dateCompleted
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {String} [status] {@link ActivitySchema}.status
     * @param {String} [activityType] {@link ActivitySchema}.activityType
     * @description Expenditures = used materials for selected period
     * @returns {PrepareResponse|InventorySchema|Pagination} Returns the Default response object.  With `data` object containing Products
     */
    getExpenditures(req, res){
        req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [], where=[];
            let areaName = 'All Activities';

            
                where.push({'userMysqlId' : req.USER_MYSQL_ID});

                let now = new Date();

                let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
                let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");
                console.log(toDate);
                //toDate.setDate(toDate.getDate() + 1);
                //console.log(toDate);
                //toDate = toDate.add(1).day();
                /**
                 * where.push({'createdAt' : { $gte: fromDate, $lt: toDate}});
                 */
                //where.push({'dateCompleted' : { $gte: fromDate, $lt: toDate}});


                // if(req.body.status && req.body.status != '')
                //     where.push({'status': req.body.status});
                let dateFilter = {};
                if(req.body.fromDate && req.body.toDate)
                    dateFilter = {dateCompleted: { $gte: fromDate, $lt: toDate}};
                else if(req.body.toDate)
                    dateFilter = {dateCompleted: { $lte: toDate}};
                else if(req.body.fromDate)
                    dateFilter = {dateCompleted: { $gte: fromDate}};


                let areaIdFilter = {};
                if(req.body.areaId)
                    areaIdFilter = {'areaId': {$eq: req.body.areaId}};
                else
                    areaIdFilter = {'areaId': {$ne: null}};
                    
                let statusFilter = {};
                if(req.body.status)
                    statusFilter = {'status': {$eq: req.body.status}};

                match = {
                    $and: [
                        {userMysqlId: req.USER_MYSQL_ID},
                        statusFilter,
                        dateFilter,
                        areaIdFilter,
                    ]
                };

                console.log(areaIdFilter);
                
            //get all user products
            //let allProducts = await Factory.models.inventory.findOne({userMysqlId: req.USER_MYSQL_ID}).exec();
            //get all user activities OR find activity with current product id and get its quantity
            /* for (let i = 0; i < allProducts.length; i++) {
                const product = allProducts[i];
                let activities = await Factory.models.activity.find({mean: product._id, dateFilter, areaIdFilter}).exec();
                
            } */
            let plannedProducts = {};

            Factory.models.activity.find(match)
            .populate({path: 'areaId', select: '_id areaName', model: Factory.models.area})
            .populate('mean')
            .exec(async(err, result)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                console.log("total activities: "+result.length);

                for (let i = 0; i < result.length; i++) {
                    const activity = result[i];
                    if(activity.mean && activity.mean.length > 0){
                        if(activity.status == 'Plan'){
                            for (let j = 0; j < activity.mean.length; j++) {
                                const myMean = activity.mean[j];
                                
                                if(myMean._id in plannedProducts){
                                    plannedProducts[myMean._id]['plannedQuantity'] += activity.meanQuantity[j]*1;
                                } else {
                                    let mean = {};//JSON.parse(JSON.stringify(activity.mean));
                                    mean['quantity'] = myMean.quantity;
                                    mean['plannedQuantity'] = activity.meanQuantity[j]*1;
                                    plannedProducts[myMean._id] = mean;
                                    //plannedProducts[activity.mean._id]['plannedQuantity'] = activity.quantity;
                                }
                                
                            }
                        } else {
                            let tasks = await Factory.models.task.find({activityId: activity._id}).exec();
                            for (let k = 0; k < tasks.length; k++) {
                                const task = tasks[k];
                                for (let j = 0; j < activity.mean.length; j++) {
                                    const myMean = activity.mean[j];
                                    
                                    if(myMean._id in plannedProducts){
                                        plannedProducts[myMean._id]['plannedQuantity'] += task.meanQuantity[j]*1;
                                    } else {
                                        let mean = {};//JSON.parse(JSON.stringify(activity.mean));
                                        mean['quantity'] = myMean.quantity;
                                        mean['plannedQuantity'] = task.meanQuantity[j]*1;
                                        plannedProducts[myMean._id] = mean;
                                        //plannedProducts[activity.mean._id]['plannedQuantity'] = activity.quantity;
                                    }
                                    
                                }
                            }
                        }
                    }
                }

                console.log("products");
                console.log(plannedProducts);

                let allProducts = JSON.parse(JSON.stringify(await Factory.models.inventory.find({userMysqlId: req.USER_MYSQL_ID}).exec()));
                
                for (let i = 0; i < allProducts.length; i++) {
                    const product = allProducts[i];
                    if(product._id in plannedProducts){
                        allProducts[i]['plannedQuantity'] = plannedProducts[product._id].plannedQuantity;
                    }else{
                        allProducts[i]['plannedQuantity'] = 0;
                    }
                }
                console.log(allProducts);

                /**
                 * pagination
                 */
                let count = allProducts.length;

                let page = Math.abs(req.query.page);
                let pagination = {
                    total: count,
                    pages: Math.ceil(count / Factory.env.PER_PAGE.PRODUCTS),
                    per_page: Factory.env.PER_PAGE.PRODUCTS,
                    page: isNaN(page) ? 1:page,
                };
                if (pagination.page <= pagination.pages) {
                    let skip = (pagination.page-1)*Factory.env.PER_PAGE.PRODUCTS;
                    pagination.previous = pagination.page - 1;
                    pagination.next = pagination.page + 1;

                    let paginatedResult = allProducts.splice(skip, pagination.per_page);

                    console.log("my hateful pagination: ");
                    console.log(pagination);

                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Expenditures data.'),
                        data: paginatedResult,
                        pagination: pagination,
                    }))
                }else{
                    console.log("my lovely page: "+pagination.page);
                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Expenditures data.'),
                        data: [],
                        pagination: pagination,
                    }))

                }
            })
        });
        
    }

    /**
     * Get shopping list overview with pagination
     * @function
     * @param {Date} [fromDate] {@link ActivitySchema}.dateCompleted
     * @param {Date} [toDate] {@link ActivitySchema}.dateCompleted
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {String} [status] {@link ActivitySchema}.status
     * @param {String} [activityType] {@link ActivitySchema}.activityType
     * @description Expenditures = used materials for selected period
     * @returns {PrepareResponse|InventorySchema|Pagination} Returns the Default response object.  With `data` object containing Products
     */
    getShoppingList(req, res){
        req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [], where=[];
            let areaName = 'All Activities';

            
                where.push({'userMysqlId' : req.USER_MYSQL_ID});

                let now = new Date();

                let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
                let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");
                console.log(toDate);
                //toDate.setDate(toDate.getDate() + 1);
                //console.log(toDate);
                //toDate = toDate.add(1).day();
                /**
                 * where.push({'createdAt' : { $gte: fromDate, $lt: toDate}});
                 */
                //where.push({'dateCompleted' : { $gte: fromDate, $lt: toDate}});


                // if(req.body.status && req.body.status != '')
                //     where.push({'status': req.body.status});
                let dateFilter = {};
                if(req.body.fromDate && req.body.toDate)
                    dateFilter = {dateCompleted: { $gte: fromDate, $lt: toDate}};
                else if(req.body.toDate)
                    dateFilter = {dateCompleted: { $lt: toDate}};
                else if(req.body.fromDate)
                    dateFilter = {dateCompleted: { $gte: fromDate}};


                let areaIdFilter = {};
                if(req.body.areaId)
                    areaIdFilter = {'areaId': {$eq: req.body.areaId}};
                else
                    areaIdFilter = {'areaId': {$ne: null}};
                    
                let statusFilter = {};
                //if(req.body.status)
                    statusFilter = {'status': {$eq: 'Plan'}};

                match = {
                    $and: [
                        {userMysqlId: req.USER_MYSQL_ID},
                        statusFilter,
                        dateFilter,
                        areaIdFilter,
                    ]
                };

                console.log(areaIdFilter);
                
            //get all user products
            //let allProducts = await Factory.models.inventory.findOne({userMysqlId: req.USER_MYSQL_ID}).exec();
            //get all user activities OR find activity with current product id and get its quantity
            /* for (let i = 0; i < allProducts.length; i++) {
                const product = allProducts[i];
                let activities = await Factory.models.activity.find({mean: product._id, dateFilter, areaIdFilter}).exec();
                
            } */
            let plannedProducts = {};

            Factory.models.activity.find(match)
            .populate({path: 'areaId', select: '_id areaName', model: Factory.models.area})
            .populate('mean')
            .exec(async(err, result)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                console.log("total activities: "+result.length);

                for (let i = 0; i < result.length; i++) {
                    const activity = result[i];
                    if(activity.mean && activity.mean.length > 0){
                        for (let j = 0; j < activity.mean.length; j++) {
                            const myMean = activity.mean[j];
                            if(myMean._id in plannedProducts){
                                plannedProducts[myMean._id]['plannedQuantity'] += activity.meanQuantity[j];
                            }else{
                                let mean = {};//JSON.parse(JSON.stringify(activity.mean));
                                mean['quantity'] = myMean.quantity;
                                mean['plannedQuantity'] = activity.meanQuantity[j];
                                plannedProducts[myMean._id] = mean;
                                //plannedProducts[activity.mean._id]['plannedQuantity'] = activity.quantity;
                            }
                        }
                    }
                }

                console.log("products");
                console.log(plannedProducts);

                let allProducts = JSON.parse(JSON.stringify(await Factory.models.inventory.find({userMysqlId: req.USER_MYSQL_ID}).exec()));
                
                for (let i = 0; i < allProducts.length; i++) {
                    const product = allProducts[i];
                    if(product._id in plannedProducts){
                        allProducts[i]['plannedQuantity'] = plannedProducts[product._id].plannedQuantity;
                    }else{
                        allProducts[i]['plannedQuantity'] = 0;
                    }
                }
                console.log(allProducts);

                /**
                 * pagination
                 */
                let count = allProducts.length;

                let page = Math.abs(req.query.page);
                let pagination = {
                    total: count,
                    pages: Math.ceil(count / Factory.env.PER_PAGE.PRODUCTS),
                    per_page: Factory.env.PER_PAGE.PRODUCTS,
                    page: isNaN(page) ? 1:page,
                };
                if (pagination.page <= pagination.pages) {
                    let skip = (pagination.page-1)*Factory.env.PER_PAGE.PRODUCTS;
                    pagination.previous = pagination.page - 1;
                    pagination.next = pagination.page + 1;

                    let paginatedResult = allProducts.splice(skip, pagination.per_page);

                    console.log("my hateful pagination: ");
                    console.log(pagination);

                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Shopping list data.'),
                        data: paginatedResult,
                        pagination: pagination,
                    }))
                }else{
                    console.log("my lovely page: "+pagination.page);
                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Shopping list data.'),
                        data: [],
                        pagination: pagination,
                    }))

                }
            })
        });
        
    }
    
    /**
     * Get fertilizer with pagination
     * @function
     * @param {Date} [fromDate] {@link ActivitySchema}.dateCompleted
     * @param {Date} [toDate] {@link ActivitySchema}.dateCompleted
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {String} [status] {@link AreaSchema}.status @default 
     * @description  = Total of a single Nutrient / {@link AreaSchema}.areaSize 
     * @returns {PrepareResponse|InventorySchema|Pagination} Returns the Default response object.  With `data` object containing Products
     */
    getFertilizerOverview(req, res){
        req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [], where=[];
            let areaName = 'All Activities';

            
            where.push({'userMysqlId' : req.USER_MYSQL_ID});

            let now = new Date();

            let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
            let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");
            console.log(toDate);
            
            
            let dateFilter = {};
            if(req.body.fromDate && req.body.toDate)
                dateFilter = {dateCompleted: { $gte: fromDate, $lt: toDate}};
            else if(req.body.toDate)
                dateFilter = {dateCompleted: { $lt: toDate}};
            else if(req.body.fromDate)
                dateFilter = {dateCompleted: { $gte: fromDate}};


            let areaIdFilter = {};
            if(req.body.areaId)
                areaIdFilter = {'areaId': {$eq: req.body.areaId}};
            else
                areaIdFilter = {'areaId': {$ne: null}};
                

            match = {
                $and: [
                    {userMysqlId: req.USER_MYSQL_ID},
                    dateFilter,
                    areaIdFilter,
                ]
            };

            console.log(match);
            
            let plannedAreas = {};

            Factory.models.activity.find(match)
            .populate({path: 'areaId', select: '_id areaName areaSize', model: Factory.models.area})
            .populate('mean')
            .exec(async(err, result)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                console.log("total activities: "+result.length);

                for (let i = 0; i < result.length; i++) {
                    const activity = result[i];
                    if(activity.areaId && activity.areaId != "" && activity.mean && activity.mean.length > 0){
                        if(activity.status == 'Plan'){
                            if(activity.areaId._id in plannedAreas){
                                for (let j = 0; j < activity.mean.length; j++) {
                                    const myMean = activity.mean[j];
                                    if(myMean.nitrogen){
                                        plannedAreas[activity.areaId._id]['nitrogen'] += myMean.nitrogen/100 * activity.meanQuantity[j];
                                    }
                                    if(myMean.phosphorus){
                                        plannedAreas[activity.areaId._id]['phosphorus'] += myMean.phosphorus/100 * activity.meanQuantity[j];
                                    }
                                }
                            }else{
                                let mean = {nitrogen: 0, phosphorus: 0};//JSON.parse(JSON.stringify(activity.mean));
                                for (let j = 0; j < activity.mean.length; j++) {
                                    const myMean = activity.mean[j];
                                    if(myMean.nitrogen){
                                        mean['nitrogen'] += myMean.nitrogen/100 * activity.meanQuantity[j];
                                    }
                                    if(myMean.phosphorus){
                                        mean['phosphorus'] += myMean.phosphorus/100 * activity.meanQuantity[j];
                                    }
                                }
                                plannedAreas[activity.areaId._id] = mean;
                            }
                        } else {
                            let tasks = await Factory.models.task.find({activityId: activity._id}).exec();
                            for (let k = 0; k < tasks.length; k++) {
                                const task = tasks[k];
                                if(activity.areaId._id in plannedAreas){
                                    for (let j = 0; j < activity.mean.length; j++) {
                                        const myMean = activity.mean[j];
                                        if(myMean.nitrogen){
                                            plannedAreas[activity.areaId._id]['nitrogen'] += myMean.nitrogen/100 * task.meanQuantity[j];
                                        }
                                        if(myMean.phosphorus){
                                            plannedAreas[activity.areaId._id]['phosphorus'] += myMean.phosphorus/100 * task.meanQuantity[j];
                                        }
                                    }
                                }else{
                                    let mean = {nitrogen: 0, phosphorus: 0};//JSON.parse(JSON.stringify(activity.mean));
                                    for (let j = 0; j < activity.mean.length; j++) {
                                        const myMean = activity.mean[j];
                                        if(myMean.nitrogen){
                                            mean['nitrogen'] += myMean.nitrogen/100 * task.meanQuantity[j];
                                        }
                                        if(myMean.phosphorus){
                                            mean['phosphorus'] += myMean.phosphorus/100 * task.meanQuantity[j];
                                        }
                                    }
                                    plannedAreas[activity.areaId._id] = mean;
                                }
                            }
                        }
                    }
                }

                console.log("areas");
                console.log(plannedAreas);

                let allAreas = JSON.parse(JSON.stringify(await Factory.models.area.find({userMysqlId: req.USER_MYSQL_ID}).exec()));
                
                for (let i = 0; i < allAreas.length; i++) {
                    const area = allAreas[i];
                    if(area._id in plannedAreas){
                        allAreas[i]['plannedNitrogen'] = plannedAreas[area._id].nitrogen;
                        allAreas[i]['plannedPhosphorus'] = plannedAreas[area._id].phosphorus;
                    }else{
                        allAreas[i]['plannedNitrogen'] = 0;
                        allAreas[i]['plannedPhosphorus'] = 0;
                    }
                }
                //console.log(allAreas);

                /**
                 * pagination
                 */
                let count = allAreas.length;

                let page = Math.abs(req.query.page);
                let pagination = {
                    total: count,
                    pages: Math.ceil(count / Factory.env.PER_PAGE.AREAS),
                    per_page: Factory.env.PER_PAGE.AREAS,
                    page: isNaN(page) ? 1:page,
                };
                if (pagination.page <= pagination.pages) {
                    let skip = (pagination.page-1)*Factory.env.PER_PAGE.AREAS;
                    pagination.previous = pagination.page - 1;
                    pagination.next = pagination.page + 1;

                    let paginatedResult = allAreas.splice(skip, pagination.per_page);

                    console.log("my hateful pagination: ");
                    console.log(pagination);

                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Fertlizer data.'),
                        data: paginatedResult,
                        pagination: pagination,
                    }))
                }else{
                    console.log("my lovely page: "+pagination.page);
                    return res.send(Factory.helpers.prepareResponse({
                        message: req.__('Fertlizer data.'),
                        data: [],
                        pagination: pagination,
                    }))

                }
            })
        });
        
    }
    /**
     * Get Products Journal with pagination
     * @function
     * @param {Date} [fromDate] {@link ActivitySchema}.dateCompleted
     * @param {Date} [toDate] {@link ActivitySchema}.dateCompleted
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {String} [activityType] {@link ActivitySchema}.activityType
     * @param {String} [status] {@link AreaSchema}.status
     * @default status = Udført and {@link ActivitySchema}.mean != null
     * @description Fertlizer overview = Total of a single Nutrient / {@link AreaSchema}.areaSize 
     * @returns {PrepareResponse|InventorySchema|Pagination} Returns the Default response object.  With `data` object containing Products
     */
    getProductsJournal(req, res){
      req.getValidationResult().then(async(result) =>{
            let match = {}, aggregation = [], where=[];
            let areaName = 'All Activities';

          
            where.push({'userMysqlId' : req.USER_MYSQL_ID});

            let now = new Date();

            let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date(now.getFullYear()+"-01-01");
            let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date(now.getFullYear()+"-12-31");
            console.log(toDate);
            //toDate.setDate(toDate.getDate() + 1);
            //console.log(toDate);
            //toDate = toDate.add(1).day();
            /**
             * where.push({'createdAt' : { $gte: fromDate, $lt: toDate}});
             */
            //where.push({'dateCompleted' : { $gte: fromDate, $lt: toDate}});


            // if(req.body.status && req.body.status != '')
            //     where.push({'status': req.body.status});
            let dateFilter = {};
            if(req.body.fromDate && req.body.toDate)
                dateFilter = {dateCompleted: { $gte: fromDate, $lt: toDate}};
            else if(req.body.toDate)
                dateFilter = {dateCompleted: { $lt: toDate}};
            else if(req.body.fromDate)
                dateFilter = {dateCompleted: { $gte: fromDate}};


            let areaIdFilter = {};
            if(req.body.areaId)
                areaIdFilter = {'areaId': {$eq: req.body.areaId}};
            else
                areaIdFilter = {'areaId': {$ne: null}};
                
            let activityTypeFilter = {};
            activityTypeFilter = {'activityType': {$in: ['spraying', 'fertilizing']}};

            
            let areas = await Factory.models.area.distinct('_id', {userMysqlId: req.USER_MYSQL_ID}).exec();
            

            match = {
                $and: [
                    // {},
                    {
                        $or: [
                            {
                                areaId: {
                                    $in: areas
                                }
                            }, 
                            {
                                userMysqlId: req.USER_MYSQL_ID
                            }
                        ]
                    },
                    activityTypeFilter,
                    dateFilter,
                    areaIdFilter,
                    {
                        status: {
                            $in:['completed', 'accepted']
                        }
                    }
                ]
            };


            console.log(JSON.stringify(match));

            
            //console.log(areas);
            
            let plannedProducts = {};

            Factory.models.task.find(match)
            .populate({path: 'areaId', select: '_id areaName areaSize farmFieldId', model: Factory.models.area})
            .populate({path: 'activityId', model: Factory.models.activity, populate :
                {path: 'mean', select: '_id name registrationNumber type', model: Factory.models.inventory}
            })
            .exec(async(err, allTasks)=>{
                if(err){
                    console.log(err)
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                console.log("total activities: "+allTasks.length);
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Products journal.'),
                    data: allTasks,
                    user_vat_number: req.VAT_NUMBER
                }))
            })

            /* Factory.models.activity.find(match)
            .populate({path: 'areaId', select: '_id areaName areaSize farmFieldId', model: Factory.models.area})
            .populate({path: 'mean', select: '_id name registrationNumber type', model: Factory.models.inventory})
            .exec(async(err, allProducts)=>{
                if(err){
                    return res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Error finding activities.')
                    }))
                }

                console.log("total activities: "+allProducts.length);
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__('Products journal.'),
                    data: allProducts,
                    user_vat_number: req.VAT_NUMBER
                }))
            }) */
      });
      
  }
}

module.exports = InventoryController