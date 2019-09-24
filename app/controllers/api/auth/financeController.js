let Factory = require('../../../util/factory');

class FinanceHelper{
    generateRevenueSalesTable(tasks){
        let retval = new Array(12).fill({treesSold:0, sales:0});
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            if(task.activityType == 'harvest'){
                let date = new Date(task.dateCompleted);
                //retval[date.getMonth()] += 1;
                let prev = retval[date.getMonth()];
                retval[date.getMonth()] = {treesSold: prev.treesSold + (task.otherQuantity*1), sales: prev.sales + (task.otherQuantity*1 * task.salePricePerUnit*1)};
            }
        }
        return retval;
    }

    generateActivityTotalCostTable(tasks){
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            if(!task.activityId)
                continue;
            let date = new Date(task.activityId.dateCompleted);
            let totalCost = 0;
            if(task.activityType == 'spraying' || task.activityType == 'fertilizing'){
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    const quantity = task.meanQuantity[index2];
                    
                    totalCost += quantity * task.activityId.meanUnitPrice[index2];
                }
            } else {
                console.log("summing by other quanttity: "+task.otherQuantity)
                totalCost += task.otherQuantity * task.salePricePerUnit;
            }
            
            if(retval[task.activityType]){
                retval[task.activityType][date.getMonth()] += totalCost;
            }else{
                retval[task.activityType] = new Array(12).fill(0);
                retval[task.activityType][date.getMonth()] = totalCost;
            }
        }

        return retval;
    }
    
    generateEmployeeCostTable(thisUserName, tasks){
        let retval = {};
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            let staffName = "YOU";
            if(task.staffId)
                staffName = task.staffId.name
            console.log("passed!");
            if(task.hourlyRate && task.hoursSpent){
                let date = new Date(task.dateCompleted);
                
                let totalCost = (task.hourlyRate*1 * task.hoursSpent*1);
                
                if(retval[staffName]){
                    retval[staffName][date.getMonth()] += totalCost;
                }else{
                    retval[staffName] = new Array(12).fill(0);
                    retval[staffName][date.getMonth()] = totalCost;
                }
            }
        }
        return retval;
    }

    generateFertilizersCostTable(tasks){
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            if(!task.activityId)
                continue;
            let date = new Date(task.activityId.dateCompleted);
            //let totalCost = 0;
            if(task.activityType == 'spraying' || task.activityType == 'fertilizing'){
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    if(task.activityId.mean[index2].type != 'fertilizer')
                        continue;

                    const quantity = task.meanQuantity[index2];
                    
                    let totalCost = quantity * task.activityId.meanUnitPrice[index2];

                    if(retval[task.activityId.meanName[index2]]){
                        retval[task.activityId.meanName[index2]][date.getMonth()] += totalCost;
                    }else{
                        retval[task.activityId.meanName[index2]] = new Array(12).fill(0);
                        retval[task.activityId.meanName[index2]][date.getMonth()] = totalCost;
                    }
                }
            }
        }

        return retval;
    }
    
    generatePesticidesCostTable(tasks){
        let retval = {};

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            //console.log(task);
            if(!task.activityId)
                continue;
            let date = new Date(task.activityId.dateCompleted);
            //let totalCost = 0;
            if(task.activityType == 'spraying' || task.activityType == 'fertilizing'){
                for (let index2 = 0; index2 < task.meanQuantity.length; index2++) {
                    if(task.activityId.mean[index2].type != 'pesticide')
                        continue;
                        
                    const quantity = task.meanQuantity[index2];
                    
                    let totalCost = quantity * task.activityId.meanUnitPrice[index2];

                    if(retval[task.activityId.meanName[index2]]){
                        retval[task.activityId.meanName[index2]][date.getMonth()] += totalCost;
                    }else{
                        retval[task.activityId.meanName[index2]] = new Array(12).fill(0);
                        retval[task.activityId.meanName[index2]][date.getMonth()] = totalCost;
                    }
                }
            }
        }

        return retval;
    }
}
class FinanceController{
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
    getFinanceA(req, res){
        console.log(req.body.age);
        let chartsFilter = [];
        if(req.body.charts){
            chartsFilter = req.body.charts.split(',');
        }
        
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }));
            }

            let match = {}, aggregation = [];
            let areaName = 'All Areas';//'All Users';
            let fromAge = req.body.fromAge;
            let toAge = req.body.toAge;
            
            let fromDate = (req.body.fromDate)? new Date(req.body.fromDate) : new Date("1970-01-01");
            let toDate = (req.body.toDate)? new Date(req.body.toDate) : new Date();
            toDate.setDate(toDate.getDate() + 1);
            match['createdAt'] = { $gte: fromDate, $lt: toDate};
            
            
            /**
             * AreaId Filter Based on Age
             */
            if(req.body.areaId){
                match['areaId'] = req.body.areaId;
                let thisArea = await Factory.models.area.findOne({_id: req.body.areaId})
                .exec();
                if(thisArea){
                    areaName = thisArea.areaName;
                }
            }else{
                //check for all areas
                match['userMysqlId'] = {$eq: req.USER_MYSQL_ID};
                let areaListBasedOnAge = [];
                if(fromAge || toAge){
                    let userAreas = await Factory.models.area.find({userMysqlId: req.USER_MYSQL_ID})
                    for (let index = 0; index < userAreas.length; index++) {
                        const thisArea = userAreas[index];
                        let startDate = new Date();
                        let nowDate = new Date();
                        let areaAge = 0;

                        if(thisArea.yearOfEstablishment && thisArea.yearOfEstablishment != "")
                            startDate = new Date(thisArea.yearOfEstablishment, 1, 1);
                        areaAge = nowDate.getFullYear() - startDate.getFullYear();

                        if(fromAge && toAge && areaAge >= fromAge && areaAge <= toAge)
                            areaListBasedOnAge.push(thisArea._id)
                        else if(fromAge && areaAge >= fromAge)
                            areaListBasedOnAge.push(thisArea._id)
                        else if(toAge && areaAge <= toAge)
                            areaListBasedOnAge.push(thisArea._id)
                        
                    }
                    match['areaId'] = {$in: areaListBasedOnAge}
                }

            }

            /**
             * activity type filter
             */
            if(req.body.activityType)
                match['activityType'] = req.body.activityType;
            
            /**
             * activity status filter
             */
            if(req.body.activityStatus)
                match['status'] = req.body.activityStatus;


            console.log("MATCH:");
            console.log(match);
            let allActivities = await Factory.models.activity.find({userMysqlId: req.USER_MYSQL_ID}).exec();
            let activitiesIdList = [];
            for (let index = 0; index < allActivities.length; index++) {
                const activity = allActivities[index];
                activitiesIdList.push(activity._id);
            }
            console.log("activities list: ")
            //console.log(activitiesIdList)
            
            let allTasks = await Factory.models.task.find({activityId: {
                $in: activitiesIdList
            }}).populate({
                path: 'activityId',
                populate: {
                    path: 'mean'
                }
            }).populate('staffId').exec();
            console.log(allTasks)
            let revenueSalesTable = (new FinanceHelper()).generateRevenueSalesTable(allTasks);
            let activityTotalCostTable = (new FinanceHelper()).generateActivityTotalCostTable(allTasks);
            let employeeCostTable = (new FinanceHelper()).generateEmployeeCostTable(req.USER_NAME, allTasks);
            let fertilizersCostTable = (new FinanceHelper()).generateFertilizersCostTable(allTasks);
            let pesticidesCostTable = (new FinanceHelper()).generatePesticidesCostTable(allTasks);

            
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

    getFinanceB(req, res){

    }
}
module.exports = FinanceController;