let Factory = require('../../util/factory')
module.exports = (router) => {
    // require all API controllers here
    // register routes and return router
    let indexController = new (require('./../../controllers/api/indexController'))(),
    auth = {
        activityController: new (require('./../../controllers/api/auth/activityController'))(),
        areaPropertyController: new (require('./../../controllers/api/auth/areaPropertyController'))(),
        areasController: new (require('./../../controllers/api/auth/areasController'))(),
        growthPlansController: new (require('./../../controllers/api/auth/growthPlansController'))(),
        inventoryController: new (require('./../../controllers/api/auth/inventoryController'))(),
        methodsController: new (require('./../../controllers/api/auth/methodsController'))(),
        nutrientController: new (require('./../../controllers/api/auth/nutrientController'))(),
        notificationController: new (require('./../../controllers/api/auth/notificationController'))(),
        staffController: new (require('./../../controllers/api/auth/staffController'))(),
        sharedWorkController: new (require('./../../controllers/api/auth/sharedWorkController'))(),
    };

    router.get('/update302To303', indexController.update302To303);
    router.get('/recalculateAge', indexController.recalculateAge);
    router.get('/calculateTrees', indexController.calculateTrees);
    router.get('/convertToLowerCase', function something(req,res){
        Factory.models.activity.find({}, function(err, data){
            if(err){
                console.log(err)
                return res.send(Factory.helpers.prepareResponse({
                    success: true,
                    message: "converted"
                }));
            }
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                if(element.name && element.name != ''){
                    element.name = element.name.toLowerCase();
                }
                if(element.contractor && element.contractor != ''){
                    element.contractor = element.contractor.toLowerCase();
                }
                if(element.performedBy && element.performedBy != ''){
                    element.performedBy = element.performedBy.toLowerCase();
                }
                if(!element.activityCategory){
                    if(element.areaId){
                        element.activityCategory = "area"
                    }
                    if(element.planId){
                        element.activityCategory = "plan"
                    }
                }
                element.save();
            }
            return res.send(Factory.helpers.prepareResponse({
                success: true,
                message: "converted"
            }));
        })
    })
    //router.get('/test', indexController.test);
    //router.post('/create-area', indexController.createArea);
    // router.get('/delete-all-trees', indexController.deleteMysqlAreasTrees);
    // router.post('/create-tree', indexController.createTree);

    let baseRoute = '/auth/user/';
    
    router.post(baseRoute + 'areas/create-area', auth.areasController.createArea);
    router.post(baseRoute + 'areas/update-area', auth.areasController.updateArea);
    router.post(baseRoute + 'areas/insert-area-images', auth.areasController.insertAreaImages);
    router.post(baseRoute + 'areas/get-area-data', auth.areasController.getAreaData);
    router.post(baseRoute + 'areas/get-all-areas-overview', auth.areasController.getAllAreasOverview);
    router.post(baseRoute + 'areas/delete-area', auth.areasController.deleteArea);
    router.post(baseRoute + 'areas/create-tree', auth.areasController.createTree);
    router.post(baseRoute + 'areas/delete-tree', auth.areasController.deleteTree);
    router.post(baseRoute + 'areas/create-activity', auth.areasController.createActivity);
    router.post(baseRoute + 'areas/get-activity-data', auth.areasController.getActivityData);
    router.post(baseRoute + 'areas/update-activity', auth.areasController.updateActivity);
    router.post(baseRoute + 'areas/delete-activity', auth.areasController.deleteActivity);
    router.post(baseRoute + 'areas/get-areas', auth.areasController.getAreas);
    router.post(baseRoute + 'areas/get-all-areas', auth.areasController.getAllAreas);
    router.post(baseRoute + 'areas/get-area-details', auth.areasController.getAreaDetails);
    router.post(baseRoute + 'areas/get-area-grouped-activities', auth.areasController.getAreaGroupedActivities);
    router.post(baseRoute + 'areas/get-area-tree-timeseries-activities', auth.areasController.getAreaTreeTimeSeriesActivities);
    router.post(baseRoute + 'areas/get-trees-graph-data', auth.areasController.getTreesGraphData);
    router.post(baseRoute + 'areas/get-trees-height-vs-assessment-graph-data', auth.areasController.getTreeHeightVsAssessmentGraphData);
    router.post(baseRoute + 'areas/deduct-quantity-from-inventory', auth.areasController.deductQuantityFromInventory);
    router.post(baseRoute + 'areas/update-activity-status', auth.areasController.updateActivityStatus);
    router.post(baseRoute + 'areas/update-area-field', auth.areasController.updateAreaField);
    router.post(baseRoute + 'areas/get-area-field', auth.areasController.getAreaField);
    router.post(baseRoute + 'areas/update-area-activity-field', auth.areasController.updateActivityField);
    router.post(baseRoute + 'areas/area-costs', auth.areasController.areaAllActivitiesCosts);
    router.post(baseRoute + 'areas/recalculate-all-activities-costs', auth.areasController.recalculateAllActivitiesCosts);

    router.post(baseRoute + 'area-property/create-property', auth.areaPropertyController.createProperty);
    router.post(baseRoute + 'area-property/edit-property', auth.areaPropertyController.editProperty);
    router.post(baseRoute + 'area-property/get-properties', auth.areaPropertyController.getProperties);
    router.post(baseRoute + 'area-property/delete-property', auth.areaPropertyController.deleteProperty);
    
    

    router.post(baseRoute + 'growth-plans/create-plan', auth.growthPlansController.createPlan);
    router.post(baseRoute + 'growth-plans/delete-plan', auth.growthPlansController.deletePlan);
    router.post(baseRoute + 'growth-plans/get-plans', auth.growthPlansController.getPlans);
    router.post(baseRoute + 'growth-plans/get-plan-activities', auth.growthPlansController.getPlanActivities);
    router.post(baseRoute + 'growth-plans/get-plan-grouped-activities', auth.growthPlansController.getPlanGroupedActivities);
    /* router.post(baseRoute + 'growth-plans/create-activity', auth.growthPlansController.createActivity);
    router.post(baseRoute + 'growth-plans/update-activity', auth.growthPlansController.updateActivity); */
    router.post(baseRoute + 'growth-plans/update-activity-age', auth.growthPlansController.updateActivityAge);
    router.post(baseRoute + 'growth-plans/delete-activity', auth.growthPlansController.deleteActivity);
    router.post(baseRoute + 'growth-plans/get-activity-data', auth.growthPlansController.getActivityData);
    router.post(baseRoute + 'growth-plans/copy-plan-activities', auth.growthPlansController.copyPlanActivities);
    router.post(baseRoute + 'growth-plans/copy-plan-activities-to-all-areas', auth.growthPlansController.copyPlanActivitiesToAllAreas);
    router.post(baseRoute + 'growth-plans/copy-single-plan-activity', auth.growthPlansController.copySinglePlanActivity);
    router.post(baseRoute + 'growth-plans/copy-single-plan-activity-to-plan', auth.growthPlansController.copySinglePlanActivityToPlan);
    router.post(baseRoute + 'growth-plans/copy-plan-to-plan', auth.growthPlansController.copyPlanToPlan);

    
    router.post(baseRoute + 'growth-plans/share-plan', auth.growthPlansController.sharePlan);
    router.post(baseRoute + 'growth-plans/view-shared-plan', auth.growthPlansController.viewSharedPlan);
    router.post(baseRoute + 'growth-plans/import-shared-plan', auth.growthPlansController.importSharedPlan);

    

    router.post(baseRoute + 'inventory/create-product', auth.inventoryController.createProduct);
    router.post(baseRoute + 'inventory/delete-product', auth.inventoryController.deleteProduct);
    router.post(baseRoute + 'inventory/get-products', auth.inventoryController.getProducts);
    router.post(baseRoute + 'inventory/edit-product', auth.inventoryController.editProduct);
    router.post(baseRoute + 'inventory/edit-product-quantity', auth.inventoryController.editProductQuantity);
    router.post(baseRoute + 'inventory/edit-product-unit-price', auth.inventoryController.editProductUnitPrice);
    router.post(baseRoute + 'inventory/edit-product-nutrients', auth.inventoryController.editProductNutrients);
    router.post(baseRoute + 'inventory/get-expenditures', auth.inventoryController.getExpenditures);
    router.post(baseRoute + 'inventory/get-shopping-list', auth.inventoryController.getShoppingList);
    router.post(baseRoute + 'inventory/get-fertilizer-overview', auth.inventoryController.getFertilizerOverview);
    router.post(baseRoute + 'inventory/get-products-journal', auth.inventoryController.getProductsJournal);

    router.post(baseRoute + 'methods/create-method', auth.methodsController.createMethod);
    router.post(baseRoute + 'methods/delete-method', auth.methodsController.deleteMethod);
    router.post(baseRoute + 'methods/get-methods', auth.methodsController.getMethods);
    router.post(baseRoute + 'methods/edit-method', auth.methodsController.editMethod);

    router.post(baseRoute + 'activity/create-activity', auth.activityController.createActivity);
    router.post(baseRoute + 'activity/delete-activity', auth.activityController.deleteActivity);
    router.post(baseRoute + 'activity/get-activities', auth.activityController.getActivities);
    router.post(baseRoute + 'activity/update-activity', auth.activityController.updateActivity);
    router.post(baseRoute + 'activity/update-mean-journal-reported', auth.activityController.updateMeanJournalReportedValue);

    router.post(baseRoute + 'nutrient/create-nutrient', auth.nutrientController.createNutrient);
    router.post(baseRoute + 'nutrient/get-nutrients', auth.nutrientController.getNutrients);
    router.post(baseRoute + 'nutrient/update-nutrient', auth.nutrientController.editNutrient);
    router.post(baseRoute + 'nutrient/delete-nutrient', auth.nutrientController.deleteNutrient);
    router.post(baseRoute + 'nutrient/get-graph-data', auth.nutrientController.getGraphData);
    router.post(baseRoute + 'nutrient/get-npk-graph-data', auth.nutrientController.getNPKGraphData);

    router.post(baseRoute + 'notification/get-notifications', auth.notificationController.getNotifications);
    router.post(baseRoute + 'notification/ignore-notification', auth.notificationController.ignoreNotification);
    
    router.post(baseRoute + 'staff/add-user', auth.staffController.addUser);
    router.post(baseRoute + 'staff/remove-user', auth.staffController.removeUser);
    router.post(baseRoute + 'staff/get-staff', auth.staffController.getStaff);
    router.post(baseRoute + 'staff/response-to-staff-request', auth.staffController.responseToStaffRequest);

    router.post(baseRoute + 'shared-work/get-shared-activities', auth.sharedWorkController.getSharedActivities);
    router.post(baseRoute + 'shared-work/get-shared-activity-data', auth.sharedWorkController.getSharedActivityData);
    router.post(baseRoute + 'shared-work/create-task', auth.sharedWorkController.createTask);
    router.post(baseRoute + 'shared-work/update-task', auth.sharedWorkController.updateTask);
    router.post(baseRoute + 'shared-work/delete-task', auth.sharedWorkController.deleteTask);
    router.post(baseRoute + 'shared-work/accept-reject-task', auth.sharedWorkController.acceptRejectTask);
    router.post(baseRoute + 'shared-work/update-mean-journal-reported', auth.sharedWorkController.updateMeanJournalReportedValue);


    
    return router;
};