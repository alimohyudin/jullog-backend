
module.exports = (router) => {
    // require all API controllers here
    // register routes and return router
    let indexController = new (require('./../../controllers/api/indexController'))(),
    auth = {
        activityController: new (require('./../../controllers/api/auth/activityController'))(),
        areasController: new (require('./../../controllers/api/auth/areasController'))(),
        growthPlansController: new (require('./../../controllers/api/auth/growthPlansController'))(),
        inventoryController: new (require('./../../controllers/api/auth/inventoryController'))(),
        methodsController: new (require('./../../controllers/api/auth/methodsController'))(),
    };

    router.get('/recalculateAge', indexController.recalculateAge);
    router.get('/calculateTrees', indexController.calculateTrees);
    //router.get('/test', indexController.test);
    //router.post('/create-area', indexController.createArea);
    // router.get('/delete-all-trees', indexController.deleteMysqlAreasTrees);
    // router.post('/create-tree', indexController.createTree);


    
    router.post('/auth/user/areas/create-area', auth.areasController.createArea);
    router.post('/auth/user/areas/update-area', auth.areasController.updateArea);
    router.post('/auth/user/areas/insert-area-images', auth.areasController.insertAreaImages);
    router.post('/auth/user/areas/get-area-data', auth.areasController.getAreaData);
    router.post('/auth/user/areas/get-all-areas-overview', auth.areasController.getAllAreasOverview);
    router.post('/auth/user/areas/delete-area', auth.areasController.deleteArea);
    router.post('/auth/user/areas/create-tree', auth.areasController.createTree);
    router.post('/auth/user/areas/delete-tree', auth.areasController.deleteTree);
    router.post('/auth/user/areas/create-activity', auth.areasController.createActivity);
    router.post('/auth/user/areas/get-activity-data', auth.areasController.getActivityData);
    router.post('/auth/user/areas/update-activity', auth.areasController.updateActivity);
    router.post('/auth/user/areas/delete-activity', auth.areasController.deleteActivity);
    router.post('/auth/user/areas/get-areas', auth.areasController.getAreas);
    router.post('/auth/user/areas/get-all-areas', auth.areasController.getAllAreas);
    router.post('/auth/user/areas/get-area-details', auth.areasController.getAreaDetails);
    router.post('/auth/user/areas/get-area-grouped-activities', auth.areasController.getAreaGroupedActivities);
    router.post('/auth/user/areas/get-area-tree-timeseries-activities', auth.areasController.getAreaTreeTimeSeriesActivities);
    router.post('/auth/user/areas/get-trees-graph-data', auth.areasController.getTreesGraphData);
    router.post('/auth/user/areas/get-trees-height-vs-assessment-graph-data', auth.areasController.getTreeHeightVsAssessmentGraphData);
    router.post('/auth/user/areas/deduct-quantity-from-inventory', auth.areasController.deductQuantityFromInventory);
    router.post('/auth/user/areas/update-activity-status', auth.areasController.updateActivityStatus);
    router.post('/auth/user/areas/update-area-field', auth.areasController.updateAreaField);
    router.post('/auth/user/areas/get-area-field', auth.areasController.getAreaField);
    router.post('/auth/user/areas/update-area-activity-field', auth.areasController.updateActivityField);
    router.post('/auth/user/areas/area-costs', auth.areasController.areaAllActivitiesCosts);
    router.post('/auth/user/areas/recalculate-all-activities-costs', auth.areasController.recalculateAllActivitiesCosts);
    

    router.post('/auth/user/growth-plans/create-plan', auth.growthPlansController.createPlan);
    router.post('/auth/user/growth-plans/delete-plan', auth.growthPlansController.deletePlan);
    router.post('/auth/user/growth-plans/get-plans', auth.growthPlansController.getPlans);
    router.post('/auth/user/growth-plans/get-plan-activities', auth.growthPlansController.getPlanActivities);
    router.post('/auth/user/growth-plans/get-plan-grouped-activities', auth.growthPlansController.getPlanGroupedActivities);
    /* router.post('/auth/user/growth-plans/create-activity', auth.growthPlansController.createActivity);
    router.post('/auth/user/growth-plans/update-activity', auth.growthPlansController.updateActivity); */
    router.post('/auth/user/growth-plans/update-activity-age', auth.growthPlansController.updateActivityAge);
    router.post('/auth/user/growth-plans/delete-activity', auth.growthPlansController.deleteActivity);
    router.post('/auth/user/growth-plans/get-activity-data', auth.growthPlansController.getActivityData);
    router.post('/auth/user/growth-plans/copy-plan-activities', auth.growthPlansController.copyPlanActivities);
    router.post('/auth/user/growth-plans/copy-plan-activities-to-all-areas', auth.growthPlansController.copyPlanActivitiesToAllAreas);
    router.post('/auth/user/growth-plans/copy-single-plan-activity', auth.growthPlansController.copySinglePlanActivity);
    router.post('/auth/user/growth-plans/copy-single-plan-activity-to-plan', auth.growthPlansController.copySinglePlanActivityToPlan);
    
    

    router.post('/auth/user/inventory/create-product', auth.inventoryController.createProduct);
    router.post('/auth/user/inventory/delete-product', auth.inventoryController.deleteProduct);
    router.post('/auth/user/inventory/get-products', auth.inventoryController.getProducts);
    router.post('/auth/user/inventory/edit-product', auth.inventoryController.editProduct);
    router.post('/auth/user/inventory/edit-product-quantity', auth.inventoryController.editProductQuantity);
    router.post('/auth/user/inventory/edit-product-unit-price', auth.inventoryController.editProductUnitPrice);
    router.post('/auth/user/inventory/edit-product-nutrients', auth.inventoryController.editProductNutrients);
    router.post('/auth/user/inventory/get-expenditures', auth.inventoryController.getExpenditures);
    router.post('/auth/user/inventory/get-fertilizer-overview', auth.inventoryController.getFertilizerOverview);
    router.post('/auth/user/inventory/get-products-journal', auth.inventoryController.getProductsJournal);

    router.post('/auth/user/methods/create-method', auth.methodsController.createMethod);
    router.post('/auth/user/methods/delete-method', auth.methodsController.deleteMethod);
    router.post('/auth/user/methods/get-methods', auth.methodsController.getMethods);
    router.post('/auth/user/methods/edit-method', auth.methodsController.editMethod);

    router.post('/auth/user/activity/create-activity', auth.activityController.createActivity);
    router.post('/auth/user/activity/delete-activity', auth.activityController.deleteActivity);
    router.post('/auth/user/activity/get-activities', auth.activityController.getActivities);
    router.post('/auth/user/activity/update-activity', auth.activityController.updateActivity);
    
    
    return router;
};