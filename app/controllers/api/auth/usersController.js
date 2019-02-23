let bcrypt = require('bcrypt-nodejs'),
Factory = require('../../../util/factory');

class UsersController {

    constructor() {}

    updateProfile(req, res) {
        let profilePhoto = (typeof req.files['profilePhoto']!= "undefined") ? req.files['profilePhoto'][0] : {mimetype: ''};
        let coverPhoto = (typeof req.files['coverPhoto']!= "undefined") ? req.files['coverPhoto'][0] : {mimetype: ''};
        req.checkBody('gender', 'The selected gender is invalid').isIn(['', 'male', 'female']);
        req.checkBody('email', 'The email is invalid').optional().isEmail();
        req.checkBody('mobile', 'The mobile number format is invalid').optional().mobile();
        req.checkBody('latitude', 'The latitude is invalid').isNumeric();
        req.checkBody('longitude', 'The longitude is invalid').isNumeric();
        req.checkBody('nationalities.*', 'The nationality is invalid').isObjectId();
        req.checkBody('interests.*', 'The interest is invalid').isObjectId();
        req.checkBody('country', 'The country is invalid').isObjectId();
        req.checkBody('city', 'The city is invalid').isObjectId();
        req.checkBody('neighbourhood', 'The neighbourhood is invalid').isObjectId();
        req.checkBody('bodyType', 'The body type is invalid').isObjectId();
        req.checkBody('orientation', 'The orientation is invalid').isObjectId();
        req.checkBody('skinColor', 'The skin color is invalid').isObjectId();
        req.checkBody('maritalStatus', 'The marital status is invalid').isObjectId();
        req.checkBody('language', 'The language is invalid').isObjectId();
        req.checkBody('purpose', 'The purpose is invalid').isObjectId();
        req.checkBody('religion', 'The religion is invalid').isObjectId();
        req.checkBody('ethnicity', 'The ethnicity is invalid').isObjectId();
        req.checkBody('height', 'The height is invalid').isNumeric();
        req.checkBody('income', 'The income is invalid').isNumeric();
        req.checkBody('hivStatus', 'The hiv status is invalid').optional().isIn(['-ve', '+ve']);
        req.checkBody('profilePhoto', 'Profile photo must be an image').isImage(profilePhoto.mimetype);
        req.checkBody('coverPhoto', 'Cover photo must be an image').isImage(coverPhoto.mimetype);
        req.checkBody('authMethod', 'The selected auth method is not allowed').isIn(['', 'facebook', 'instagram', 'linkedin']);
        if (req.body.authMethod=='facebook' || req.body.authMethod=='instagram' || req.body.authMethod=='linkedin') {
            req.checkBody('id', 'The ID field is required').required();
            req.checkBody('accessToken', 'The access token field is required').required();
        }
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let profileInputs = [
                    "fullName", "gender", "email", "mobile", "twoFactorAuthentication", "bitmoji", "address", 
                    "latitude", "longitude", "occupation", "education", "about", "height", "income", 
                    "school", "hivStatus", 
                    // "country", "city", "neighbourhood", "bodyType", "orientation", 
                    // "skinColor", "maritalStatus", "language", "purpose", "religion", "ethnicity", 
                ],
                relations = [
                    'country', 'city', 'neighbourhood', 'bodyType', 'orientation', 
                    'skinColor', 'maritalStatus', 'language', 'purpose', 'religion', 
                    'ethnicity', 'facebook', 'instagram', 'linkedin', 
                    "nationalities", "interests"
                ],
                userData = req.USER,
                id = req.USER._id,
                profilePhotoPath = await Factory.helpers.upload(profilePhoto, 'profile_photos'),
                coverPhotoPath = await Factory.helpers.upload(coverPhoto, 'cover_photos');
                userData.updatedAt = new Date();
                delete userData._id;
                if (coverPhotoPath.length > 0) {
                    userData.coverPhoto = coverPhotoPath;
                }
                else {
                    delete userData.coverPhoto;
                }
                if (profilePhotoPath.length > 0) {
                    userData.profilePhoto = profilePhotoPath;
                }
                else {
                    delete userData.profilePhoto;
                }
                for (let i in relations) {
                    if (Object.keys(userData[relations[i]]).length <= 0 && (typeof req.body[relations[i]]=='undefined' || !req.body[relations[i]])) {
                        userData[relations[i]] = null;
                    }
                    else {
                        if (req.body[relations[i]]) {
                            userData[relations[i]] = req.body[relations[i]];
                        }
                    }
                }
                for (let i in req.body) {
                    if (i=='mobile') {
                        if (req.body.mobile!=req.USER.mobile) {
                            let existingMobileNumbers = await Factory.models.user.count({mobile: req.body.mobile});
                            if (existingMobileNumbers > 0) {
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Mobile number exists, please login'),
                                }));
                            }
                            // send new verification SMS
                            let verificationCode = await Factory.helpers.getRandomString(6, true);
                            let msg = `TickToss mobile verification code is ${verificationCode}`;
                            Factory.helpers.sendSMS(msg, req.body.mobile, (res) => {
                                //console.log('twilio response => ', res.sid);
                            });
                            userData.mobileVerified = false;
                            userData.verificationCode = verificationCode;
                        }
                    }
                    else if (i=='email') {
                        if (req.body.email!=req.USER.email) {
                            let existingEmails = await Factory.models.user.count({email: req.body.email});
                            if (existingEmails > 0) {
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Email already taken, try another'),
                                }));
                            }
                            // send verification link email
                            let verificationCode = await Factory.helpers.getRandomString(6, true);
                            let msg = `Hi<br>Please use ${verificationCode} as your email verification code.`;
                            Factory.helpers.sendMail(req.body.email, 'TickToss email verification', msg);
                            userData.emailVerified = false;
                            userData.emailVerificationCode = verificationCode;
                        }
                    }
                    if (profileInputs.indexOf(i) > -1) {
                        userData[i] = req.body[i];
                    }
                }
                if (req.body.authMethod) {
                    if (req.body.authMethod.length > 0) {
                        // check if anyone else has same Auth ID
                        let match = {}, aggregation = [];
                        match[req.body.authMethod+'.id'] = req.body.id;
                        aggregation = [
                            { $match: {_id: {$ne: id}}},
                            { $unwind: '$'+req.body.authMethod},
                            { $match: match},
                            { $group: {_id: '$_id'}}
                        ];
                        let sameAuthIDs = await Factory.models.user.aggregate(aggregation).exec();
                        if (sameAuthIDs.length > 0) {
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Invalid auth ID')
                            }));
                        }
                        userData[req.body.authMethod] = {id: req.body.id, accessToken: req.body.accessToken};
                    }
                }
                Factory.models.user.update({_id: id}, userData, (err) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        Factory.models.user.findOne({_id: id})
                        .populate('country')
                        .populate('city')
                        .populate('neighbourhood')
                        .populate('bodyType')
                        .populate('skinColor')
                        .populate('orientation')
                        .populate('maritalStatus')
                        .populate('language')
                        .populate('purpose')
                        .populate('photos')
                        .populate('religion')
                        .populate('ethnicity')
                        .populate('nationalities')
                        .populate('interests')
                        .exec(async(error, updatedUser) => {
                            if (error || !updatedUser) {
                                //console.log(error);
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Something went wrong, try later'),
                                }));
                            }
                            else {
                                res.send(Factory.helpers.prepareResponse({
                                    message: req.__('Profile updated'),
                                    data: await Factory.helpers.setDefaultValues(Object.assign(updatedUser.toObject(), {token: req.body.token}))
                                }));
                            }
                        });
                    }
                });
            }
        });
    }

    updateMyProfile(req, res) {
        let profilePhoto = (typeof req.files['profilePhoto']!= "undefined") ? req.files['profilePhoto'][0] : {mimetype: ''};
        let coverPhoto = (typeof req.files['coverPhoto']!= "undefined") ? req.files['coverPhoto'][0] : {mimetype: ''};
        req.checkBody('gender', 'The selected gender is invalid').isIn(['', 'male', 'female']);
        req.checkBody('email', 'The email is invalid').optional().isEmail();
        req.checkBody('mobile', 'The mobile number format is invalid').optional().mobile();
        req.checkBody('latitude', 'The latitude is invalid').isNumeric();
        req.checkBody('longitude', 'The longitude is invalid').isNumeric();
        req.checkBody('nationalities.*', 'The nationality is invalid').isObjectId();
        req.checkBody('interests.*', 'The interest is invalid').isObjectId();
        req.checkBody('country', 'The country is invalid').isObjectId();
        req.checkBody('city', 'The city is invalid').isObjectId();
        req.checkBody('neighbourhood', 'The neighbourhood is invalid').isObjectId();
        req.checkBody('bodyType', 'The body type is invalid').isObjectId();
        req.checkBody('orientation', 'The orientation is invalid').isObjectId();
        req.checkBody('skinColor', 'The skin color is invalid').isObjectId();
        req.checkBody('maritalStatus', 'The marital status is invalid').isObjectId();
        req.checkBody('language', 'The language is invalid').isObjectId();
        req.checkBody('purpose', 'The purpose is invalid').isObjectId();
        req.checkBody('religion', 'The religion is invalid').isObjectId();
        req.checkBody('ethnicity', 'The ethnicity is invalid').isObjectId();
        req.checkBody('height', 'The height is invalid').isNumeric();
        req.checkBody('income', 'The income is invalid').isNumeric();
        req.checkBody('hivStatus', 'The hiv status is invalid').optional().isIn(['-ve', '+ve']);
        req.checkBody('profilePhoto', 'Profile photo must be an image').isImage(profilePhoto.mimetype);
        req.checkBody('coverPhoto', 'Cover photo must be an image').isImage(coverPhoto.mimetype);
        req.checkBody('authMethod', 'The selected auth method is not allowed').isIn(['', 'facebook', 'instagram', 'linkedin']);
        if (req.body.authMethod=='facebook' || req.body.authMethod=='instagram' || req.body.authMethod=='linkedin') {
            req.checkBody('id', 'The ID field is required').required();
            req.checkBody('accessToken', 'The access token field is required').required();
        }
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let profileInputs = [
                    "fullName", "gender", "email", "mobile", "twoFactorAuthentication", "bitmoji", "address", 
                    "latitude", "longitude", "occupation", "education", "about", "height", "income", 
                    "school", "hivStatus", 
                    // "country", "city", "neighbourhood", "bodyType", "orientation", 
                    // "skinColor", "maritalStatus", "language", "purpose", "religion", "ethnicity", 
                ],
                relations = [
                    'country', 'city', 'neighbourhood', 'bodyType', 'orientation', 
                    'skinColor', 'maritalStatus', 'language', 'purpose', 'religion', 
                    'ethnicity', 'facebook', 'instagram', 'linkedin', 
                    "nationalities", "interests"
                ],
                userData = req.USER,
                id = req.USER._id,
                profilePhotoPath = await Factory.helpers.upload(profilePhoto, 'profile_photos'),
                coverPhotoPath = await Factory.helpers.upload(coverPhoto, 'cover_photos');
                userData.updatedAt = new Date();
                delete userData._id;
                if (coverPhotoPath.length > 0) {
                    userData.coverPhoto = coverPhotoPath;
                }
                else {
                    delete userData.coverPhoto;
                }
                if (profilePhotoPath.length > 0) {
                    userData.profilePhoto = profilePhotoPath;
                }
                else {
                    delete userData.profilePhoto;
                }
                for (let i in relations) {
                    if (Object.keys(userData[relations[i]]).length <= 0 && (typeof req.body[relations[i]]=='undefined' || !req.body[relations[i]])) {
                        userData[relations[i]] = null;
                    }
                    else {
                        if (req.body[relations[i]]) {
                            userData[relations[i]] = req.body[relations[i]];
                        }
                    }
                }
                for (let i in req.body) {
                    if (i=='mobile') {
                        if (req.body.mobile!=req.USER.mobile) {
                            let existingMobileNumbers = await Factory.models.user.count({mobile: req.body.mobile});
                            if (existingMobileNumbers > 0) {
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Mobile number exists, please login'),
                                }));
                            }
                            // send new verification SMS
                            let verificationCode = await Factory.helpers.getRandomString(6, true);
                            let msg = `TickToss mobile verification code is ${verificationCode}`;
                            Factory.helpers.sendSMS(msg, req.body.mobile, (res) => {
                                //console.log('twilio response => ', res.sid);
                            });
                            userData.mobileVerified = false;
                            userData.verificationCode = verificationCode;
                        }
                    }
                    else if (i=='email') {
                        if (req.body.email!=req.USER.email) {
                            let existingEmails = await Factory.models.user.count({email: req.body.email});
                            if (existingEmails > 0) {
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Email already taken, try another'),
                                }));
                            }
                            // send verification link email
                            let verificationCode = await Factory.helpers.getRandomString(6, true);
                            let msg = `Hi<br>Please use ${verificationCode} as your email verification code.`;
                            Factory.helpers.sendMail(req.body.email, 'TickToss email verification', msg);
                            userData.emailVerified = false;
                            userData.emailVerificationCode = verificationCode;
                        }
                    }
                    if (profileInputs.indexOf(i) > -1) {
                        userData[i] = req.body[i];
                    }
                }
                if (req.body.authMethod) {
                    if (req.body.authMethod.length > 0) {
                        // check if anyone else has same Auth ID
                        let match = {}, aggregation = [];
                        match[req.body.authMethod+'.id'] = req.body.id;
                        aggregation = [
                            { $match: {_id: {$ne: id}}},
                            { $unwind: '$'+req.body.authMethod},
                            { $match: match},
                            { $group: {_id: '$_id'}}
                        ];
                        let sameAuthIDs = await Factory.models.user.aggregate(aggregation).exec();
                        if (sameAuthIDs.length > 0) {
                            return res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Invalid auth ID')
                            }));
                        }
                        userData[req.body.authMethod] = {id: req.body.id, accessToken: req.body.accessToken};
                    }
                }
                Factory.models.user.update({_id: id}, userData, (err) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        Factory.models.user.findOne({_id: id})
                        .populate('country')
                        .populate('city')
                        .populate('neighbourhood')
                        .populate('bodyType')
                        .populate('skinColor')
                        .populate('orientation')
                        .populate('maritalStatus')
                        .populate('language')
                        .populate('purpose')
                        .populate('photos')
                        .populate('religion')
                        .populate('ethnicity')
                        .populate('nationalities')
                        .populate('interests')
                        .exec(async(error, updatedUser) => {
                            if (error || !updatedUser) {
                                //console.log(error);
                                return res.send(Factory.helpers.prepareResponse({
                                    success: false,
                                    message: req.__('Something went wrong, try later'),
                                }));
                            }
                            else {
                                res.send(Factory.helpers.prepareResponse({
                                    message: req.__('Profile updated'),
                                    data: await Factory.helpers.setDefaultValues(Object.assign(updatedUser.toObject(), {token: req.body.token}), true, req.body.translateTo)
                                }));
                            }
                        });
                    }
                });
            }
        });
    }

    updateLocation(req, res) {
        req.checkBody('latitude', 'The latitude is required').required().isNumeric().withMessage('The latitude is invalid');
        req.checkBody('longitude', 'The longitude is required').required().isNumeric().withMessage('The longitude is invalid');
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let location = {latitude: req.body.latitude, latitude: req.body.latitude};
                Factory.models.user.update({_id: req.USER._id}, location, (err) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Something went wrong, try later'),
                        }));
                    }
                    else {
                        location.address = req.USER.address;
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Location updated'),
                            data: location
                        }));
                    }
                });
            }
        });
    }

    changePassword(req, res) {
        req.checkBody('oldPassword', 'Old password field is required').required();
        req.checkBody('password', 'The password field is required').required().isLength(6).withMessage('The password is too short');
        req.checkBody('passwordConfirmation', 'Password confirmation must match').same(req.body.password);
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let oldPassword = bcrypt.hashSync(req.body.oldPassword, Factory.env.BCRYPT_SALT);
                if (oldPassword===req.USER_PASSWORD) {
                    let data = {
                        password: bcrypt.hashSync(req.body.password, Factory.env.BCRYPT_SALT),
                        updatedAt: new Date()
                    };
                    Factory.models.user.update({_id: req.USER._id}, data, (err) => {
                        if (err) {
                            //console.log(err);
                            res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Something went wrong, try later'),
                            }));
                        }
                        else {
                            res.send(Factory.helpers.prepareResponse({
                                message: req.__('Password updated'),
                            }));
                        }
                    });
                }
                else { 
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Old password does not match'),
                    }));
                }
            }
        });
    }

    async resendMobileVerificationCode(req, res) {
        if (!req.USER.mobileVerified) {
            // send new verification SMS
            let verificationCode = await Factory.helpers.getRandomString(6, true);
            let msg = `TickToss mobile verification code is ${verificationCode}`;
            Factory.helpers.sendSMS(msg, req.USER.mobile, (res) => {
                //console.log('twilio response => ', res.sid);
            });
            Factory.models.user.update({_id: req.USER._id}, {verificationCode: verificationCode, updatedAt: new Date()}, (err) => {
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong, try later'),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Verification code sent'),
                    }));
                }
            });
        }
        else { 
            res.send(Factory.helpers.prepareResponse({
                success: false,
                message: req.__('Mobile number already verified'),
            }));
        }
    }

    verifyMobile(req, res) {
        req.checkBody('verificationCode', 'The verification code field is required').required();
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                if (req.body.verificationCode===req.USER_VERIFICATION_CODE) {
                    let data = {
                        mobileVerified: true,
                        updatedAt: new Date()
                    };
                    Factory.models.user.update({_id: req.USER._id}, data, (err) => {
                        if (err) {
                            //console.log(err);
                            res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Something went wrong, try later'),
                            }));
                        }
                        else {
                            res.send(Factory.helpers.prepareResponse({
                                message: req.__('Mobile number verified successfully'),
                            }));
                        }
                    });
                }
                else { 
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Verification code does not match'),
                    }));
                }
            }
        });
    }

    async resendVerificationEmail(req, res) {
        if (!req.USER.mobileVerified) {
            // send verification link email
            let verificationCode = await Factory.helpers.getRandomString(6, true);
            let msg = `Hi<br>Please use ${verificationCode} as your email verification code.`;
            Factory.helpers.sendMail(req.USER.email, 'TickToss email verification', msg);
            Factory.models.user.update({_id: req.USER._id}, {verificationCode: verificationCode, updatedAt: new Date()}, (err) => {
                if (err) {
                    //console.log(err);
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Something went wrong, try later'),
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Verification email sent'),
                    }));
                }
            });
        }
        else { 
            res.send(Factory.helpers.prepareResponse({
                success: false,
                message: req.__('Email already verified'),
            }));
        }
    }

    verifyEmail(req, res) {
        req.checkBody('emailVerificationCode', 'The email verification code field is required').required();
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                if (req.body.emailVerificationCode===req.USER_EMAIL_VERIFICATION_CODE) {
                    let data = {
                        emailVerified: true,
                        updatedAt: new Date()
                    };
                    Factory.models.user.update({_id: req.USER._id}, data, (err) => {
                        if (err) {
                            //console.log(err);
                            res.send(Factory.helpers.prepareResponse({
                                success: false,
                                message: req.__('Something went wrong, try later'),
                            }));
                        }
                        else {
                            res.send(Factory.helpers.prepareResponse({
                                message: req.__('Email address verified successfully'),
                            }));
                        }
                    });
                }
                else { 
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Verification code does not match'),
                    }));
                }
            }
        });
    }

    profile(req, res) {
        req.checkBody('user', 'Please select a user').required().isObjectId().withMessage('The selected user is invalid');
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                Factory.models.user.findOne({_id: req.body.user})
                .populate('country')
                .populate('city')
                .populate('neighbourhood')
                .populate('bodyType')
                .populate('skinColor')
                .populate('orientation')
                .populate('maritalStatus')
                .populate('language')
                .populate('purpose')
                .populate('photos')
                .populate('religion')
                .populate('ethnicity')
                .populate('nationalities')
                .populate('interests')
                .exec(async(err, user) => {
                    if (err) {
                        //console.log(err);
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("Something went wrong, try later"),
                        }));
                    }
                    else if (!user) {
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__("User does not exist"),
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__("User profile"),
                            data: await Factory.helpers.setDefaultValues(user.toObject(), true, req.body.language)
                        }));
                    }
                });
            }
        });
    }

    async stories(req, res) {
        let users = {
            friends: [],
            matches: [],
            followings: [],
        }, 
        storyDate = new Date();
        storyDate = storyDate.setDate(storyDate.getDate() - 1);
        let friends = Factory.models.user.find({friendsStoryAt: {$gte: storyDate}});
    }

}

module.exports = UsersController