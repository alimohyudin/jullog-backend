let Factory = require('../../../util/factory');

module.exports = class InventoryController {

    constructor() {}

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
            let productType = (req.body.activityType == 'fertilizing')?'fertilizer':'pesticide';
            
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
                product.save();
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product quantity changed!"),
                    data: {}
                }))
            })
        });
    }
    
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
                
                return res.send(Factory.helpers.prepareResponse({
                    message: req.__("Product unitPrice changed!"),
                    data: {}
                }))
            })
        });
    }

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
                    dateFilter = {dateCompleted: { $lt: toDate}};
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
                    if(activity.mean && activity.mean != ""){
                        if(activity.mean._id in plannedProducts){
                            plannedProducts[activity.mean._id]['plannedQuantity'] += activity.quantity;
                        }else{
                            let mean = {};//JSON.parse(JSON.stringify(activity.mean));
                            mean['quantity'] = activity.mean.quantity;
                            mean['plannedQuantity'] = activity.quantity;
                            plannedProducts[activity.mean._id] = mean;
                            //plannedProducts[activity.mean._id]['plannedQuantity'] = activity.quantity;
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


    getFertilizerOverview(req, res){
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
                    

                match = {
                    $and: [
                        {userMysqlId: req.USER_MYSQL_ID},
                        dateFilter,
                        areaIdFilter,
                    ]
                };

                console.log(areaIdFilter);
            
            //get all areas populate
            //let allProducts = await Factory.models.inventory.findOne({userMysqlId: req.USER_MYSQL_ID}).exec();
            //get all user activities OR find activity with current product id and get its quantity
            /* for (let i = 0; i < allProducts.length; i++) {
                const product = allProducts[i];
                let activities = await Factory.models.activity.find({mean: product._id, dateFilter, areaIdFilter}).exec();
                
            } */
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
                    if(activity.areaId && activity.areaId != "" && activity.mean && activity.mean != ""){
                        if(activity.areaId._id in plannedAreas){
                            if(activity.mean.nitrogen && activity.mean.quantity){
                                plannedAreas[activity.areaId._id]['nitrogen'] += activity.mean.nitrogen/100 * activity.quantity;
                                plannedAreas[activity.areaId._id]['phosphorus'] += activity.mean.phosphorus/100 * activity.quantity;
                            }
                            console.log("\n\nif: "+activity.areaId._id)
                            console.log(activity.mean.nitrogen)
                            console.log(activity.quantity)
                            console.log(activity.mean.phosphorus)
                            console.log(plannedAreas[activity.areaId._id])
                        }else{
                            let mean = {};//JSON.parse(JSON.stringify(activity.mean));
                            if(activity.mean.nitrogen && activity.mean.quantity){
                                mean['nitrogen'] = activity.mean.nitrogen/100 * activity.quantity;
                                mean['phosphorus'] = activity.mean.phosphorus/100 * activity.quantity;
                            } else {
                                mean['nitrogen'] = 0;
                                mean['phosphorus'] = 0;
                            }
                            plannedAreas[activity.areaId._id] = mean;
                            //plannedAreas[activity.mean._id]['plannedQuantity'] = activity.quantity;
                            console.log("\n\nelse: "+activity.areaId._id)
                            
                            console.log(activity.mean.nitrogen)
                            console.log(activity.mean.phosphorus)
                            console.log(activity.quantity)
                            console.log(plannedAreas[activity.areaId._id])
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
              if(req.body.activityType)
                  activityTypeFilter = {'activityType': {$eq: req.body.activityType}};

              match = {
                  $and: [
                      {userMysqlId: req.USER_MYSQL_ID},
                      activityTypeFilter,
                      dateFilter,
                      areaIdFilter,
                      {status: 'Udført'},
                      {'mean': {$ne: null}}
                  ]
              };

              console.log(JSON.stringify(match));
              
          //get all user products
          //let allProducts = await Factory.models.inventory.findOne({userMysqlId: req.USER_MYSQL_ID}).exec();
          //get all user activities OR find activity with current product id and get its quantity
          /* for (let i = 0; i < allProducts.length; i++) {
              const product = allProducts[i];
              let activities = await Factory.models.activity.find({mean: product._id, dateFilter, areaIdFilter}).exec();
              
          } */
          let plannedProducts = {};

          Factory.models.activity.find(match)
          .populate({path: 'areaId', select: '_id areaName areaSize farmFieldId', model: Factory.models.area})
          .populate('mean')
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
              //console.log(allProducts);

              /**
               * pagination
               */
              /* let count = allProducts.length;

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

              } */
          })
      });
      
  }
}