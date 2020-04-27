let Factory = require('../../../util/factory');

class FinanceHelper {
    generateRevenueSalesTable(activities, tasks, interval) {
        let retval = {}; //new Array(12).fill({treesSold:0, sales:0});

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];

            //tasks data only used for status=Udført/Igang
            if (task.activityId.status != 'Udført' && task.activityId.status != 'Igang')
                continue;

            if (task.activityType == 'harvest') {
                let date = new Date(task.dateCompleted);
                //retval[retvalIndex] += 1;
                let retvalIndex = date.getUTCMonth();
                if (interval == 'yearly')
                    retvalIndex = date.getUTCFullYear();

                let prev = retval[retvalIndex];

                if (!prev)
                    prev = { treesSold: 0, sales: 0 };
                retval[retvalIndex] = { treesSold: prev.treesSold + (task.otherQuantity * 1), sales: prev.sales + (task.otherQuantity * 1 * task.salePricePerUnit * 1) };
            }
        }

        for (let index = 0; index < activities.length; index++) {
            const activity = activities[index];

            //tasks data only used for status=Udført/Igang
            if (activity.status != 'Plan')
                continue;

            if (activity.activityType == 'harvest') {
                let date = new Date(activity.dateCompleted);
                //retval[retvalIndex] += 1;
                let retvalIndex = date.getUTCMonth();
                if (interval == 'yearly')
                    retvalIndex = date.getUTCFullYear();

                let prev = retval[retvalIndex];
                if (!prev)
                    prev = { treesSold: 0, sales: 0 };
                retval[retvalIndex] = { treesSold: prev.treesSold + (activity.meanTotalQuantity * 1), sales: prev.sales + (activity.sellingPricePerUnit * 1 * activity.meanTotalQuantity * 1) };
            }
        }

        return retval;
    }

    generateActivityTotalCostTable(activities, tasks, interval) {
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];

            if (!task.activityId)
                continue;

            //tasks data only used for status=Udført/Igang
            if (task.activityId.status != 'Udført' && task.activityId.status != 'Igang')
                continue;

            let date = new Date(task.activityId.dateCompleted);
            let totalCost = 0;
            if (task.activityType == 'spraying' || task.activityType == 'fertilizing') {
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    const quantity = task.meanQuantity[index2];
                    if (quantity > 0 && task.activityId.meanUnitPrice[index2] > 0)
                        totalCost += quantity * task.activityId.meanUnitPrice[index2];
                }
                if (task.hoursSpent && task.hourlyRate)
                    totalCost += task.hoursSpent * task.hourlyRate;
            } else {
                if (task.otherQuantity > 0 && task.salePricePerUnit > 0)
                    totalCost += task.otherQuantity * task.salePricePerUnit;

                if (task.hoursSpent && task.hourlyRate)
                    totalCost += task.hoursSpent * task.hourlyRate;
            }

            let retvalIndex = date.getUTCMonth();
            if (interval == 'yearly')
                retvalIndex = date.getUTCFullYear();

            if (retval[task.activityType]) {
                if (retval[task.activityType][retvalIndex])
                    retval[task.activityType][retvalIndex] += totalCost;
                else
                    retval[task.activityType][retvalIndex] = totalCost;
            } else {
                retval[task.activityType] = {};
                retval[task.activityType][retvalIndex] = totalCost;
            }
        }

        for (let index = 0; index < activities.length; index++) {
            const activity = activities[index];


            //tasks data only used for status=Udført/Igang
            if (activity.status != 'Plan')
                continue;

            let date = new Date(activity.dateCompleted);

            let totalCost = 0;
            if (activity.activityType == 'spraying' || activity.activityType == 'fertilizing') {
                if (activity.meanQuantity) {
                    /* for (let index2 = 0; index2 < activity.meanQuantity.length; index2++) {
                        const quantity = activity.meanQuantity[index2];
                        if(quantity > 0 && activity.meanUnitPrice[index2] > 0)
                            totalCost += quantity * activity.meanUnitPrice[index2];
                    } */
                    totalCost = activity.totalCost;
                }
            } else {
                if (activity.meanTotalQuantity > 0 && activity.salePricePerUnit > 0)
                    totalCost = activity.meanTotalQuantity * activity.salePricePerUnit;
            }

            let retvalIndex = date.getUTCMonth();
            if (interval == 'yearly')
                retvalIndex = date.getUTCFullYear();

            if (retval[activity.activityType]) {
                if (retval[activity.activityType][retvalIndex])
                    retval[activity.activityType][retvalIndex] += totalCost;
                else
                    retval[activity.activityType][retvalIndex] = totalCost;
            } else {
                retval[activity.activityType] = {};
                retval[activity.activityType][retvalIndex] = totalCost;
            }


        }

        return retval;
    }

    generateEmployeeCostTable(thisUserName, tasks, interval) {
        let retval = {};
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            let staffName = "YOU";
            if (task.staffId)
                staffName = task.staffId.name
            if (task.hourlyRate && task.hoursSpent) {
                let date = new Date(task.dateCompleted);

                let totalCost = (task.hourlyRate * 1 * task.hoursSpent * 1);

                let retvalIndex = date.getUTCMonth();
                if (interval == 'yearly')
                    retvalIndex = date.getUTCFullYear();

                if (retval[staffName]) {
                    if (retval[staffName][retvalIndex])
                        retval[staffName][retvalIndex] += totalCost;
                    else
                        retval[staffName][retvalIndex] = totalCost;
                } else {
                    retval[staffName] = {};
                    retval[staffName][retvalIndex] = totalCost;
                }
            }
        }
        return retval;
    }

    generateFertilizersCostTable(activities, tasks, interval) {
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];

            if (!task.activityId)
                continue;

            //tasks data only used for status=Udført/Igang
            if (task.activityId.status != 'Udført' && task.activityId.status != 'Igang')
                continue;

            let date = new Date(task.activityId.dateCompleted);
            //let totalCost = 0;
            if (task.activityType == 'spraying' || task.activityType == 'fertilizing') {
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    if (task.activityId.mean[index2].type != 'fertilizer')
                        continue;

                    const quantity = task.meanQuantity[index2];

                    let totalCost = quantity * task.activityId.meanUnitPrice[index2];

                    let retvalIndex = date.getUTCMonth();
                    if (interval == 'yearly')
                        retvalIndex = date.getUTCFullYear();

                    if (retval[task.activityId.meanName[index2]]) {
                        if (retval[task.activityId.meanName[index2]][retvalIndex])
                            retval[task.activityId.meanName[index2]][retvalIndex] += totalCost;
                        else
                            retval[task.activityId.meanName[index2]][retvalIndex] = totalCost;
                    } else {
                        retval[task.activityId.meanName[index2]] = {};
                        retval[task.activityId.meanName[index2]][retvalIndex] = totalCost;
                    }
                }
            }
        }

        for (let index = 0; index < activities.length; index++) {
            const activity = activities[index];

            //tasks data only used for status=Udført/Igang
            if (task.status != 'Plan')
                continue;

            let date = new Date(activity.dateCompleted);
            //let totalCost = 0;
            if (activity.activityType == 'spraying' || activity.activityType == 'fertilizing') {
                if (activity.meanQuantity) {
                    for (let index2 = 0; index2 < activity.meanQuantity.length; index2++) {
                        if (activity.mean[index2].type != 'fertilizer')
                            continue;

                        const quantity = activity.meanQuantity[index2];

                        let totalCost = quantity * activity.meanUnitPrice[index2];

                        let retvalIndex = date.getUTCMonth();
                        if (interval == 'yearly')
                            retvalIndex = date.getUTCFullYear();

                        if (retval[activity.meanName[index2]]) {
                            if (retval[activity.meanName[index2]][retvalIndex])
                                retval[activity.meanName[index2]][retvalIndex] += totalCost;
                            else
                                retval[activity.meanName[index2]][retvalIndex] = totalCost;
                        } else {
                            retval[activity.meanName[index2]] = {};
                            retval[activity.meanName[index2]][retvalIndex] = totalCost;
                        }
                    }
                }
            }
        }

        return retval;
    }

    generatePesticidesCostTable(activities, tasks, interval) {
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            if (!task.activityId)
                continue;

            //tasks data only used for status=Udført/Igang
            if (task.activityId.status != 'Udført' && task.activityId.status != 'Igang')
                continue;

            let date = new Date(task.activityId.dateCompleted);
            //let totalCost = 0;
            if (task.activityType == 'spraying' || task.activityType == 'fertilizing') {
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    if (task.activityId.mean[index2].type != 'pesticide')
                        continue;

                    const quantity = task.meanQuantity[index2];

                    let totalCost = quantity * task.activityId.meanUnitPrice[index2];

                    let retvalIndex = date.getUTCMonth();
                    if (interval == 'yearly')
                        retvalIndex = date.getUTCFullYear();

                    if (retval[task.activityId.meanName[index2]]) {
                        if (retval[task.activityId.meanName[index2]][retvalIndex])
                            retval[task.activityId.meanName[index2]][retvalIndex] += totalCost;
                        else
                            retval[task.activityId.meanName[index2]][retvalIndex] = totalCost;
                    } else {
                        retval[task.activityId.meanName[index2]] = {};
                        retval[task.activityId.meanName[index2]][retvalIndex] = totalCost;
                    }
                }
            }
        }

        for (let index = 0; index < activities.length; index++) {
            const activity = activities[index];

            //tasks data only used for status=Udført/Igang
            if (activity.status != 'Plan')
                continue;

            let date = new Date(activity.dateCompleted);
            //let totalCost = 0;
            if (activity.activityType == 'spraying' || activity.activityType == 'fertilizing') {
                if (activity.meanQuantity) {
                    for (let index2 = 0; index2 < activity.meanQuantity.length; index2++) {
                        if (activity.mean[index2].type != 'pesticide')
                            continue;

                        const quantity = activity.meanQuantity[index2];

                        let totalCost = quantity * activity.meanUnitPrice[index2];

                        let retvalIndex = date.getUTCMonth();
                        if (interval == 'yearly')
                            retvalIndex = date.getUTCFullYear();


                        if (retval[activity.meanName[index2]]) {
                            if (retval[activity.meanName[index2]][retvalIndex])
                                retval[activity.meanName[index2]][retvalIndex] += totalCost;
                            else
                                retval[activity.meanName[index2]][retvalIndex] = totalCost;
                        } else {
                            retval[activity.meanName[index2]] = {};
                            retval[activity.meanName[index2]][retvalIndex] = totalCost;
                        }
                    }
                }
            }
        }

        return retval;
    }

    async getSavedSettings(req) {
        let filters = req.body;
        //console.log('SAVING FILTER TO: something');
        let filter = await Factory.models.settings.findOne({ name: filters.savedFilterSetting, type: 'activities_filters' }).exec();
        ////console.log(filter);
        if (filter) {
            console.log('Got something in filter');
            //console.log(filter);
            //filter.value = JSON.stringify(filters);
            //await filter.save();
            console.log(filter.value);

            return JSON.parse(filter.value);
        } else {
            return req.body;
            //return {};
            //console.log('Got nothing in filter');
            //console.log(filter);
            //await Factory.models.settings({userMysqlId: req.USER_MYSQL_ID, name: filters.saveFilterTo, value: JSON.stringify(filters)}).save();
        }
    }
}
class FinanceController {
    /**
     * Get Trees Data for Graphs
     * @function
     * @param {String} [areaId] {@link AreaSchema}._id
     * @param {Date} [fromDate] {@link ActivitySchema}.createdAt
     * @param {Date} [toDate] {@link ActivitySchema}.createdAt
     * @param {Number} [age] {@link TreeSchema}.age
     * @param {String} [charts] Comma seperated charts names
     * @description It filters and aggregates trees data and send for the graphs.
     * @returns {PrepareResponse|ActivitySchema} Returns the Default response object.  With `data` object of custom type
     */
    async getFinanceA(req, res) {
        console.log(req.body.age);
        let chartsFilter = [];
        if (req.body.charts) {
            chartsFilter = req.body.charts.split(',');
        }

        if (req.body.savedFilterSetting) {
            console.log('yes getting');
            let filters = await (new FinanceHelper()).getSavedSettings(req);
            req.body = filters;
            console.log('AFTER GETTING:');
            console.log(req.body);
        }

        req.getValidationResult().then(async (result) => {
            if (!result.isEmpty()) {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let match = {}, aggregation = [];
            let areaName = 'All Areas';
            let fromAge = req.body.fromAge;
            let toAge = req.body.toAge;

            let fromDate = (req.body.fromDate) ? new Date(req.body.fromDate) : new Date("1970-01-01");
            let toDate = (req.body.toDate) ? new Date(req.body.toDate) : new Date();
            match['dateCompleted'] = { $gte: fromDate, $lte: toDate };

            /**
             * AreaId Filter Based on Age and Based on Area Property
             */
            if (req.body.areaId) {
                match['areaId'] = req.body.areaId;
                let thisArea = await Factory.models.area.findOne({ _id: req.body.areaId })
                    .exec();
                if (thisArea) {
                    areaName = thisArea.areaName;
                }
            } else {
                //check for all areas
                match['userMysqlId'] = { $eq: req.USER_MYSQL_ID };
                let areaListBasedOnAge = [];
                if (fromAge || toAge || req.body.areaProperty) {
                    let userAreas = await Factory.models.area.find({ userMysqlId: req.USER_MYSQL_ID })
                    for (let index = 0; index < userAreas.length; index++) {
                        const thisArea = userAreas[index];
                        let startDate = new Date();
                        let nowDate = new Date();
                        let areaAge = 0;

                        if (thisArea.yearOfEstablishment && thisArea.yearOfEstablishment != "")
                            startDate = new Date(thisArea.yearOfEstablishment, 1, 1);
                        areaAge = nowDate.getFullYear() - startDate.getFullYear();

                        if (fromAge && toAge && areaAge >= fromAge && areaAge <= toAge)
                            areaListBasedOnAge.push(thisArea._id)
                        else if (fromAge && areaAge >= fromAge)
                            areaListBasedOnAge.push(thisArea._id)
                        else if (toAge && areaAge <= toAge)
                            areaListBasedOnAge.push(thisArea._id)

                        if (req.body.areaProperty && thisArea.properties.includes(req.body.areaProperty))
                            areaListBasedOnAge.push(thisArea._id)

                    }
                    match['areaId'] = { $in: areaListBasedOnAge }
                }

            }

            /**
             * activity type filter
             */
            if (req.body.activityType)
                match['activityType'] = req.body.activityType;

            /**
             * activity status filter
             */
            if (req.body.activityStatus)
                match['status'] = req.body.activityStatus;


            console.log("MATCH:");
            console.log(match);
            let allActivities = await Factory.models.activity.find(
                match
            )
                .populate('mean')
                .exec();

            let activitiesIdList = [];
            for (let index = 0; index < allActivities.length; index++) {
                const activity = allActivities[index];
                activitiesIdList.push(activity._id);
            }
            //console.log("activities list: ")
            //console.log(activitiesIdList)

            let allTasks = await Factory.models.task.find({
                activityId: {
                    $in: activitiesIdList
                }
            }).populate({
                path: 'activityId',
                populate: {
                    path: 'mean'
                }
            }).populate('staffId').exec();
            //console.log("all tasks:")
            //console.log(allTasks)
            let revenueSalesTable = (new FinanceHelper()).generateRevenueSalesTable(allActivities, allTasks, req.body.interval);
            let activityTotalCostTable = (new FinanceHelper()).generateActivityTotalCostTable(allActivities, allTasks, req.body.interval);
            let employeeCostTable = (new FinanceHelper()).generateEmployeeCostTable(req.USER_NAME, allTasks, req.body.interval);
            let fertilizersCostTable = (new FinanceHelper()).generateFertilizersCostTable(allActivities, allTasks, req.body.interval);
            let pesticidesCostTable = (new FinanceHelper()).generatePesticidesCostTable(allActivities, allTasks, req.body.interval);


            //console.log(employeeCostTable)

            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Graph(s) data.'),
                data: {
                    revenueSalesTable: revenueSalesTable,
                    activityTotalCostTable: activityTotalCostTable,
                    employeeCostTable: employeeCostTable,
                    fertilizersCostTable: fertilizersCostTable,
                    pesticidesCostTable: pesticidesCostTable
                }
            }));
        });
    }

    getFinanceB(req, res) {

    }

    getFinanceC(req, res) {
        /**
         * fromDate = From Year
         */
        req.checkBody('fromYear', 'from Year is required').required();

        req.getValidationResult().then(async (result) => {
            let match = {};

            match['userMysqlId'] = { $eq: req.USER_MYSQL_ID };

            let fromDate = new Date(req.body.fromYear, 1, 1);
            let toDate = new Date((req.body.fromYear * 1 + 10), 12, 1);
            match['dateCompleted'] = { $gte: fromDate, $lte: toDate };

            if (req.body.areaId && req.body.areaId != '')
                match['areaId'] = req.body.areaId;

            /* if (req.body.status && req.body.status != '')
                match['status'] = req.body.status;
            else
                match['status'] = { $in: ['Udført', 'Plan'] };
                 */
            match['status'] = { $in: ['Udført', 'Plan'] };

            console.log("Match: ");
            console.log(match);

            let allActivities = await Factory.models.activity.find(match)
            .exec();
            allActivities.sort(function (a, b) {
                return new Date(a.dateCompleted) - new Date(b.dateCompleted);
            });

            let data = {};
            data['harvestQty'] = 0, data['plantingQty'] = 0, data['totalTrees'] = 0;
            for (let index = 0; index < allActivities.length; index++) {
                const activity = allActivities[index];
                let myYear = (new Date(activity.dateCompleted)).getFullYear();
                if ((activity.activityType in data)) {
                    //console.log("key exists");
                } else {
                    //console.log("key doesn't exists");
                    data[activity.activityType] = { totalCost: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], meanCost: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], machineCost: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
                }

                let index2 = myYear - req.body.fromYear;
                if(req.body.status == 'Plan'){
                    data[activity.activityType]['totalCost'][index2] += activity.totalCost;
                } else if(req.body.status == 'Udført'){
                    data[activity.activityType]['totalCost'][index2] += (activity.status == 'Udført' && activity.actualTotalCost)?activity.actualTotalCost: 0;
                } else {
                    data[activity.activityType]['totalCost'][index2] += (activity.status == 'Plan')?activity.totalCost: (activity.actualTotalCost)?activity.actualTotalCost:0;
                }

                if(activity.meanCost){
                    if(req.body.status == 'Plan')
                        data[activity.activityType]['meanCost'][index2] += activity.meanCost;
                    else if(req.body.status == 'Udført'){
                        for (let index = 0; index < activity.actualMeanQuantity.length; index++) {
                            const quantity = activity.actualMeanQuantity[index];
                            data[activity.activityType]['meanCost'][index2] += activity.meanUnitPrice[index]*quantity;
                        }
                    } else {
                        if(activity.status == 'Plan')
                            data[activity.activityType]['meanCost'][index2] += activity.meanCost;
                        else {
                            for (let index = 0; index < activity.actualMeanQuantity.length; index++) {
                                const quantity = activity.actualMeanQuantity[index];
                                data[activity.activityType]['meanCost'][index2] += activity.meanUnitPrice[index]*quantity;
                            }
                        }
                    }
                    //actualMeanQuantity

                }
                if(activity.machineCost){
                    data[activity.activityType]['machineCost'][index2] += activity.machineCost;
                }

                /**
                 * Current Number of trees
                 */
                if (activity.activityType == 'harvest' || activity.activityType == 'scrap'){
                    data['totalTrees'] -= activity.meanTotalQuantity * 1;
                    if(activity.activityType == 'harvest')
                        data['harvestQty'] += activity.meanTotalQuantity * 1;
                }else if (activity.activityType == 'planting'){
                    data['totalTrees'] += activity.meanTotalQuantity * 1;
                    data['plantingQty'] += activity.meanTotalQuantity * 1;
                }
            }
            //console.log(data);
            return res.send(Factory.helpers.prepareResponse({
                message: req.__('Finance-C data.'),
                data: data
            }));
        });
    }
}
module.exports = FinanceController;