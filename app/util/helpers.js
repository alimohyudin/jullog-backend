'use strict';
let twilio = require('twilio'),
nodemailer = require('nodemailer'),
crypto = require('crypto'),
fs = require('fs'),
Factory = require('../util/factory'),
Bandwidth = require('node-bandwidth'),
sharp = require('sharp');

class Helpers {
    
    constructor() { }

    url(path, isImage) {
        if (path && isImage!=true) {
            path = path.trim();
            if (path.length > 0 && path != '/') {
                return Factory.env.BASE_URL+'/'+path;
            }
        }
        // check if image
        if (isImage==true) {
            // check if path is provided
            if (path) {
                // check if file exists at given path
                if (fs.existsSync(path)) {
                    return Factory.env.BASE_URL+'/'+path;
                }
            }
            return Factory.env.BASE_URL+'/assets/site/img/default.jpg';
        }
        return Factory.env.BASE_URL;
    }

    async unlockLocker(user, password, lockerHash, model) {
        if (lockerHash.length > 0) {
            if (password===lockerHash) {
                let privateLocker = await model.findOne({user: user}).lean(true);
                if (Object.keys(privateLocker).length > 0) {
                    return privateLocker;
                }
                else {
                    return this.prepareResponse({
                        success: false,
                        message: 'Could not find your locker',
                    });
                }
            }
            else {
                return this.prepareResponse({
                    success: false,
                    message: (lockerHash.length <= 0) ? 'Please create a password for locker first':'Authentication failed',
                });
            }
        }
        else {
            return this.prepareResponse({
                success: false,
                message: 'Please create a password for locker first',
            });
        }
    }

    async getTranslatedCollection(collection, language) {
        let response = [];
        if (collection) {
            if (collection.length > 0) {
                for (let i in collection) {
                    response.push({
                        _id: collection[i]._id,
                        title: await this.getTranslation(collection[i], language),
                        createdAt: collection[i].createdAt,
                        updatedAt: collection[i].updatedAt,
                    });
                }
            }
        }
        return response;
    }

    getTranslation(object, language) {
        let title = "";
        if (object) {
            if (object.translations) {
                if (object.translations.length > 0) {
                    if (!language) {
                        language = Factory.env.DEFAULT_LANGUAGE;
                    }
                    for (let l in object.translations) {
                        if (object.translations[l].language==language) {
                            title = object.translations[l].title;
                        }
                    }
                }
            }
        }
        return title;
    }

    async setDefaultValues (userData, translations, language) {
        let relations = {
            'country': {}, 'city': {}, 'neighbourhood': {}, 'bodyType': {}, 'orientation': {}, 
            'skinColor': {}, 'maritalStatus': {}, 'language': {}, 'purpose': {}, 'religion': {}, 
            'ethnicity': {}, 'facebook': {}, 'instagram': {}, 'linkedin': {}, "nationalities": [], 
            "interests": []
        };
        for (let i in relations) {
            if (!userData[i]) {
                userData[i] = relations[i];
            }
            else {
                if (translations && i!='language') {
                    if (userData[i] instanceof Array) {
                        userData[i] = await this.getTranslatedCollection(userData[i], language);
                    }
                    else {
                        userData[i] = {
                            _id: userData[i]._id,
                            title: await this.getTranslation(userData[i], language),
                            createdAt: userData[i].createdAt,
                            updatedAt: userData[i].updatedAt,
                        }; 
                    }
                }
            }
        }
        if (userData.photos.length > 0) {
            for (let i in userData.photos) {
                if (typeof userData.photos[i]!='string' && typeof userData.photos[i]=='object') {
                    userData.photos[i].image = this.url(userData.photos[i].image, true);
                }
            }
        }
        userData.profilePhoto = this.url(userData.profilePhoto, true);
        userData.coverPhoto = this.url(userData.coverPhoto, true);
        userData.hasPrivateLocker = userData.privateLockerPassword.length > 0;
        userData._id = (typeof userData._id.toString=='function') ? userData._id.toString():userData._id;
        delete userData.__v;
        delete userData.privateLockerPassword;
        delete userData.fingerprint;
        delete userData.verificationCode;
        delete userData.resetPasswordCode;
        delete userData.emailVerificationCode;
        delete userData.blockedBy;
        delete userData.following;
        delete userData.followers;
        delete userData.friends;
        delete userData.matches;
        delete userData.friendRequests;
        delete userData.likedStories;
        delete userData.likedPosts;
        delete userData.password;
        delete userData.deletedAt;
        return userData;
    }

    getMonthName (monthIndex, short) {
        let monthName = Factory.env.MONTHS[monthIndex];
        if (short) {
            return monthName.substring(0,3);
        }
        return monthName;
    }
    
    getDayName(dayIndex, short) {
        let dayName = Factory.env.DAYS[dayIndex];
        if (short) {
            return dayName.substring(0,3);
        }
        return dayName;
    }

    getRandomString(len, numericOnly) {
        let result = '';
        let chars = (numericOnly==true) ? '0123456789':'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let length = (len) ? len:Factory.env.RANDOM_STRING_LENGTH;
        for (let i = length; i > 0; --i) {
            result += chars[Math.round(Math.random() * (chars.length - 1))];
        }
        return result;
    }

    sendSMS(msg, receiver, callback) {
        let client = new Bandwidth({
            userId: Factory.env.BANDWIDTH.USER_ID, 
            apiToken: Factory.env.BANDWIDTH.API_TOKEN,
            apiSecret: Factory.env.BANDWIDTH.API_SECRET,
        });
        client.Message.send({
            from: Factory.env.BANDWIDTH.FROM, // This must be a Catapult number on your account
            to: receiver,
            text: msg
        })
        .then(callback)
        .catch((err) => {
            console.log(err.message);
        });
        // let client = new twilio(Factory.env.TWILIO.SID, Factory.env.TWILIO.TOKEN);
        console.log('sending sms');
        // client.messages.create({
        //     body: msg, 
        //     to: receiver,
        //     from: Factory.env.TWILIO.FROM,
        // })
        // .then(callback)
        // .catch((ex) => {
        //     console.log('ERROR: ', ex);
        // });
    }

    /* upload(file, directory, isLocker) {
        if (file.originalname) {
            let fileName = (new Date().getTime())+'-'+file.originalname,
            destination = Factory.env.PATHS.uploads+directory+'/'+fileName;
            if (isLocker) {
                destination = Factory.env.PATHS.LOCKERS+directory+'/'+fileName;
            }
            fs.createReadStream(Factory.env.PATHS.temp+file.filename)
            .pipe(fs.createWriteStream(destination));
            fs.unlink(Factory.env.PATHS.temp+file.filename, function(err) {
                if(err) console.log(err);
            });
            return (!isLocker) ? `assets/uploads/${directory+'/'+fileName}`:fileName;
        }
        else {
            return '';
        }
    } */

    /* upload(file, directory, isLocker) {
        console.log("uploading image here...")
        if (file.originalname) {
            let fileName = (new Date().getTime())+'-'+file.originalname,
            //destination = Factory.env.PATHS.uploads+directory+'/'+fileName;
            destination = Factory.env.PATHS.uploads+directory;
            imagemin([Factory.env.PATHS.temp+file.filename], destination, {
                plugins: [
                    imageminJpegtran({quality: '65-80'}),
                    imageminPngquant({quality: '65-80'})
                ]
            }).then(files => {
                console.log(files);
                return `assets/uploads/${directory+'/'+fileName}`;
                //=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]
            }).catch(err => {
                console.log("Exception creating file");
                console.log(err);
                return '';
            });
        }
        else {
            return '';
        }
    } */

    upload(file, directory, isLocker) {
        if (file.originalname) {
            let transform = sharp();

            let fileName = (new Date().getTime())+'-'+file.originalname,
            destination = Factory.env.PATHS.uploads+directory+'/'+fileName;
            if (isLocker) {
                destination = Factory.env.PATHS.LOCKERS+directory+'/'+fileName;
            }
            const readStream = fs.createReadStream(Factory.env.PATHS.temp+file.filename);
            transform = transform.resize(1000, 1000).max();
            readStream.pipe(transform).pipe(fs.createWriteStream(destination));
            //.pipe(fs.createWriteStream(destination));
            console.log("uploaded to: "+destination);
            fs.unlink(Factory.env.PATHS.temp+file.filename, function(err) {
                if(err) console.log(err);
            });
            
            return (!isLocker) ? `assets/uploads/${directory+'/'+fileName}`:fileName;
        }
        else {
            return '';
        }
    }

    sendMail(receiver, subject, message) {
        let transporter = nodemailer.createTransport(Factory.env.MAIL.CONFIG);
        let options = {
            from: `"TickToss" ${Factory.env.MAIL.FROM}`,
            to: receiver,
            subject: subject,
            text: message
        };
        transporter.sendMail(options, (err, info) => {
            if (err) {
                throw err;
                console.log("email sending failed: " + receiver);
            }
            else {
                console.log("email sent to: " + receiver);
            }
        });
    }
    /**
     * @typedef Pagination
     * @property {Number} total - Total count of items
     * @property {Number} pages - Total pages
     * @property {Number} per_page -  Per page items
     * @property {Number} page  - current page number
     */

    /**
     * @typedef HttpResponse
     * @property {Boolean} success
     * @property {String} message
     * @property {Object} data
     * @property {Pagination} pagination
     * @property {Object} extras
     */

    /**
     * Default HTTP Response
     * @function PrepareResponse
     * @param {Object} content 
     * @return {HttpResponse}
     */
    prepareResponse(content) {
        let response = {
            success: true,
            message: "Ok",
            data: {},
        };
        if (typeof content.success!='undefined' && typeof content.success!=undefined) {
            response.success = content.success;
        }
        if (typeof content.message!='undefinded' && typeof content.success!=undefined) {
            response.message = content.message;
        }
        if (typeof content.data!='undefined' && typeof content.data!=undefined) {
            response.data = content.data;
        }
        if (typeof content.pagination!='undefined' && typeof content.pagination!=undefined) {
            response.pagination = content.pagination;
        }
        if (typeof content.extras!='undefined' && typeof content.extras!=undefined) {
            response.extras = content.extras;
        }
        return response;
    }

    encrypt(str) {
        let cipher = crypto.createCipher(Factory.env.ENCRYPTION_ALGORITHM, Factory.env.ENCRYPTION_SALT),
        crypted = cipher.update(str,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    }
        
    decrypt(text) {
        let decipher = crypto.createDecipher(Factory.env.ENCRYPTION_ALGORITHM, Factory.env.ENCRYPTION_SALT)
        let dec = decipher.update(text,'hex','utf8')
        dec += decipher.final('utf8');
        return dec;
    }




    /* Helpers for tender-app */
    
    /* calculateGraphPercentages */
    /* data: aggregated and counted data*/
    /* propertyType: multichoice or empty */
    async calculateGraphPercentages(data, property, propertyType){
        
        console.log(data);

        let updatedResult = {};
        let multichoiceTotalCount = 0;
        if(propertyType == 'multichoice'){
            for (let i = data.length - 1; i >= 0; i--) {
                //console.log(data[i]._id+": "+data[i].count);
                if(data[i]._id != null && data[i]._id != '' && (data[i]._id).includes(",")){
                    //console.log("{contains sub} "+data[i]._id)
        
                    //split by , delimiter and write in updated result
                    let splitted  = data[i]._id.split(",");
                    
                    for (let j = splitted.length - 1; j >= 0; j--) {
                        let collonRemoved = splitted[j].split(":")[1];
                        if(collonRemoved === undefined)
                            collonRemoved = splitted[j];
                            
                        if(collonRemoved in updatedResult)
                            updatedResult[collonRemoved] += data[i].count;
                        else
                            updatedResult[collonRemoved] = data[i].count;
                    }
                }
                else if(data[i]._id != null && data[i]._id != ''){
                    //console.log("{doesn't contains sub} "+data[i]._id)
        
                    let collonRemoved = data[i]._id;
                    
                    if(collonRemoved.includes(":"))
                        collonRemoved = data[i]._id.split(":")[1];
        
                    if(collonRemoved in updatedResult)
                        updatedResult[collonRemoved] += data[i].count;
                    else
                        updatedResult[collonRemoved] = data[i].count;
                }

                if(data[i]._id != null && data[i]._id != '')
                    multichoiceTotalCount += data[i].count;
            }
        }
        else{

            for (let i = data.length - 1; i >= 0; i--) {
                //console.log(data[i]._id+": "+data[i].count);
                if(data[i]._id != null && !data[i]._id.includes("Vælg")){
                    let key = data[i]._id;
                    if(data[i]._id.includes(":"))
                        key = data[i]._id.split(":")[1];
                    //console.log("{doesn't contains sub} "+data[i]._id)
                    
                    updatedResult[key] = data[i].count;
                }
            }
        }

        //let total = data.length;

        let total = 0;
        if(propertyType != 'multichoice'){
            for (let key in updatedResult) {
                if (updatedResult.hasOwnProperty(key)) {
                    //console.log(key + " -> " + updatedResult[key]);
                    total += updatedResult[key];
                }
            }
        }else{
            total = multichoiceTotalCount;
        }

        let percentages = [];
        for (let i in property.defaultValues) {
            let key = property.defaultValues[i];
            
            if (updatedResult.hasOwnProperty(key)) {
                console.log(key + " -> " + updatedResult[key]);
                percentages[i] = Math.round((updatedResult[key]/total*100)*100)/100;
                console.log()
                console.log("percentage: "+percentages[i]);
            }
            else{
                percentages[i] = 0;
            }
        }

        let finalResult = {};
        finalResult["property"] = property;
        finalResult["normalValues"] = updatedResult;
        finalResult["percentageValues"] = percentages;
        finalResult['totalCount'] = total;
        console.log(finalResult);
        return finalResult;
        /* return total;
        return updatedResult; */
    }


    groupBy(list, keyGetter) {
        const map = new Map();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }

    calculateCurrentTreeNumbers(thisTimeSeries, numberOfTrees){
        console.log("Total: "+numberOfTrees)
        let totalInitialTrees = numberOfTrees;
        for (let i = 0; i < thisTimeSeries.length; i++) {
            const element = thisTimeSeries[i];
            //element.calculatedTreeNumber = totalInitialTrees - element.meanTotalQuantity;
            totalInitialTrees -= element.meanTotalQuantity;
            console.log("quantity: "+element.meanTotalQuantity);
            console.log("now total: "+ totalInitialTrees);
        }

        console.log("Final Answer: "+ totalInitialTrees);
        return totalInitialTrees;
    }

    calculateAllCurrentTreeNumbers(areaId){
        let currentTrees = 0;
        let match = {};
        //match['activities'] = {$ne: []};
        if(areaId)
            match['_id'] = areaId;

        Factory.models.area.find(match)
        .populate({path: 'activities', match:{'dateCompleted' : {$lte: new Date}}, options: { sort: { 'dateCompleted': 1 } } })
        .exec(async(err, result) =>{
            if(err){
                console.log("Found error while updating all current tree numbers.");
                return -1;
            }
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                if(element.activities.length>0 && element.numberOfTrees){
                    /* currentTrees = Factory.helpers.calculateCurrentTreeNumbers(element.activities, element.numberOfTrees); */
                    /* BIG CHANGE: start with zero */
                    currentTrees = Factory.helpers.calculateCurrentTreeNumbers(element.activities, 0);

                    element.currentNumberOfTrees = currentTrees;
                    element.save();
                }
                else{
                    /* if(element.numberOfTrees){
                        element.currentNumberOfTrees = element.numberOfTrees;
                        element.save();
                    } */
                    /* BIG CHANGE: start with zero */
                    element.currentNumberOfTrees = 0;
                    element.save();
                    console.log("above condition not met.");
                }
            }

        });


    }

    /* Calculation of tree numbers */
    async calculateAllTreeNumbersForArea(areaId){
        let retVal = [];        
        console.log(areaId);

        let result = await Factory.models.area.findOne({_id: areaId})
        .populate({path: 'activities', match:{activityType:{$in:['harvest', 'scrap', 'planting']}},  options: { sort: { 'dateCompleted': 1 } } })
        .exec();

        console.log(result.activities.length);
        
        const element = result;
        console.log(element.activities.length)
        if(element.activities.length>0){ /* && element.numberOfTrees){ */
        
            let thisTimeSeries = element.activities;
            /* let totalInitialTrees = element.numberOfTrees; */
            /* BIG CHANGE: start with zero */
            let totalInitialTrees = 0;

            console.log(totalInitialTrees);
            for (let i = 0; i < thisTimeSeries.length; i++) {
                
                const subElement = thisTimeSeries[i];
                if(!subElement.dateCompleted){
                    subElement.dateCompleted = new Date(1970);
                }

                let meanTotalQuantity = subElement.meanTotalQuantity;
                if(subElement.status == 'Udført')
                    meanTotalQuantity = subElement.actualMeanTotalQuantity;

                /* if(subElement.activityType == "planting"){
                    subElement.calculatedTreeNumber = totalInitialTrees + meanTotalQuantity;
                    totalInitialTrees += meanTotalQuantity;
                }
                else{
                    subElement.calculatedTreeNumber = totalInitialTrees - meanTotalQuantity;
                    totalInitialTrees -= meanTotalQuantity;
                } */

                console.log("activity type: "+subElement.activityType);
                console.log("quantity: "+subElement.meanTotalQuantity);
                console.log("now total: "+ totalInitialTrees);

                if(subElement.activityType != 'planting')
                    totalInitialTrees -= meanTotalQuantity;
                else
                    totalInitialTrees += meanTotalQuantity;


                console.log("quantity: "+meanTotalQuantity);
                console.log("now total: "+ totalInitialTrees);

                retVal[i] = {dateCompleted: subElement.dateCompleted, numberOfTrees: totalInitialTrees};
                //console.log(retVal);
            }
        }
        else{
            console.log("above condition not met.");
        }
        console.log(retVal)
        return retVal;
    }

    /**
     * Re calculate costs for All Activities under an area 
     */
    async recalculateAllActivitiesCost(areaId, req){
        let logMetaData = {
            areaId: areaId,
            userMysqlId: req.USER_MYSQL_ID,
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            recalculateCostFunctionLog: {
                area: {},
                activities: {},
            }
        };

        await Factory.models.area.findOne({_id: areaId})
        .then(async (area)=>{
            
            console.log(area.toObject());
            logMetaData.recalculateCostFunctionLog.area = area.toObject();

            let allActivities = await Factory.models.activity.find({areaId: areaId}, null, {sort: {'dateCompleted': 1}}).exec();

            /* allActivities.sort(function(a,b){
                return new Date(a.dateCompleted) - new Date(b.dateCompleted);
                }); */

            console.log(allActivities);
            logMetaData.recalculateCostFunctionLog.activities = JSON.parse(JSON.stringify(allActivities));
            /* let currentNumberOfTrees = area.numberOfTrees*1; */
            /* BIG CHANGE: start with zero */
            let currentNumberOfTrees = 0;
            console.log("Current Number of Trees:"+currentNumberOfTrees);

            for (var i = 0; i < allActivities.length; i++) {

                if(allActivities[i].autoUpdate == false || allActivities[i].status == 'Udført')
                {
                    //ignore if autoupdate has false value, but if it is not added in database then perform else condition
                    let thisMeanTotalQuantity = allActivities[i].meanTotalQuantity*1;
                    if(allActivities[i].status == 'Udført')
                        thisMeanTotalQuantity = allActivities[i].actualMeanTotalQuantity;

                    if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                        currentNumberOfTrees -= thisMeanTotalQuantity;
                    else if(allActivities[i].activityType == 'planting')
                        currentNumberOfTrees += thisMeanTotalQuantity;
                }
                else
                {
                    console.log("Updating");
                    console.log("Before Quantity: "+currentNumberOfTrees);

                    let percentage = allActivities[i].percentage;
                    allActivities[i]['meanQuantity'] =  [];
                    allActivities[i]['meanTotalQuantity'] = 0;
                    allActivities[i]['meanCost'] = 0;
                    //calculate product quantity
                    //calculate mean cost
                    if(allActivities[i].activityType == 'spraying' || allActivities[i].activityType == 'fertilizing'){
                        if(allActivities[i].mean && allActivities[i].mean.length > 0){
                            for (let j = 0; j < allActivities[i].mean.length; j++) {
                                const element = allActivities[i].mean[j];
                                if(allActivities[i].methodUnit == "ha"){
                                    allActivities[i]['meanQuantity'][j] = (allActivities[i].meanDose[j]*area.areaSize*(percentage/100)).toFixed(2);
                                } else if(allActivities[i].methodUnit == "pcs"){
                                    allActivities[i]['meanQuantity'][j] = (allActivities[i].meanDose[j]*currentNumberOfTrees*(percentage/100)).toFixed(2);
                                } else {
                                    allActivities[i]['meanQuantity'][j] = 0;
                                }
                                allActivities[i]['meanTotalQuantity'] += allActivities[i]['meanQuantity'][j]*1;
                                allActivities[i]['meanCost'] += allActivities[i]['meanQuantity'][j]*allActivities[i].meanUnitPrice[j]
                            }
                        }
                    }
                    else if(allActivities[i].activityType == 'planting'){
                        //type=plantning; the qty field= (10.000/(rowdistance xplantdistance)) x trackpercentage x area size
                        if(allActivities[i].rowDistance > 0 && allActivities[i].plantDistance > 0)
                            allActivities[i]['meanTotalQuantity'] = (( (10000 / (allActivities[i].rowDistance * allActivities[i].plantDistance) ) * area.areaSize * (1 - allActivities[i].trackPercentage/100))).toFixed(2);
                        else
                            allActivities[i]['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(2);
                    }
                    else {
                        if(allActivities[i].methodUnit == "ha")
                            allActivities[i]['meanTotalQuantity'] = (area.areaSize*(percentage/100)).toFixed(2);
                        else if(allActivities[i].methodUnit == "pcs")
                            allActivities[i]['meanTotalQuantity'] = (currentNumberOfTrees*(percentage/100)).toFixed(2);
                    }

                    /* calculate current number of trees as well */
                    if(allActivities[i].activityType == 'harvest' || allActivities[i].activityType == 'scrap')
                        currentNumberOfTrees -= allActivities[i].meanTotalQuantity*1;
                    else if(allActivities[i].activityType == 'planting')
                        currentNumberOfTrees += allActivities[i].meanTotalQuantity*1;

                    //calculate machine cost
                    if(allActivities[i].methodUnit == 'ha'){
                        //allActivities[i]['machineCost'] = allActivities[i].meanCost * area.areaSize * (percentage/100);
                        allActivities[i]['machineCost'] = (allActivities[i].methodUnitPrice * area.areaSize*(percentage/100)).toFixed(2);
                        if(allActivities[i].methodUnitsPerHour && allActivities[i].methodUnitsPerHour > 0)
                            allActivities[i]['hoursSpent'] = area.areaSize * (percentage/100) / allActivities[i].methodUnitsPerHour;
                    }else if(allActivities[i].methodUnit == 'pcs'){
                        allActivities[i]['machineCost'] = (allActivities[i].methodUnitPrice * allActivities[i].meanTotalQuantity*(percentage/100)).toFixed(2);
                        if(allActivities[i].methodUnitsPerHour && allActivities[i].methodUnitsPerHour > 0)
                            allActivities[i]['hoursSpent'] = allActivities[i].meanTotalQuantity*(percentage/100) / allActivities[i].methodUnitsPerHour;
                    }
                    
                    //calculate total cost
                    allActivities[i]['totalCost'] = allActivities[i]['meanCost']*1 + allActivities[i]['machineCost']*1;
                    
                    let Activity = Factory.models.activity;
                    var newActivity = new Activity(allActivities[i]);

                    await newActivity.save().then(function(saved){
                        console.log(saved)
                        console.log('activity saved')
                    });
                    
                }

                console.log("After Quantity: "+currentNumberOfTrees);
                console.log("Updated");
            }
            //return "done";
            Factory.logger.log({
                level: 'info',
                message: `Recalculate All areas costs - ${req.originalUrl} - ${req.method}`,
                meta: logMetaData
            });
            console.log("done")
        }, function (err){
            if(err){
                console.error(err)
                logMetaData.error = err
                Factory.logger.log({
                    level: 'error',
                    message: `Recalculate All areas costs - ${req.originalUrl} - ${req.method}`,
                    meta: logMetaData
                });
                //return "not done";
            }
        })
    }


    /**
     * General delete api implementation
     */
    generalDeleteApi(req,res, tableName, idFieldName){
        req.checkBody(idFieldName, idFieldName+' is required').required();
        req.getValidationResult().then(async(result) =>{
            if(!result.isEmpty()){
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg)
                }))
            }

            Factory.models[tableName].findOneAndRemove({_id: req.body[idFieldName]}, function(err, deletedNoted){
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__("Something went wrong, try later"),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__(tableName+' deleted'),
                    }));
                }
            })

        });
    }
}

module.exports = Helpers