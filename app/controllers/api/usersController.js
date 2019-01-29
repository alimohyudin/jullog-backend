let bcrypt = require('bcrypt-nodejs'),
jwt = require('jsonwebtoken'),
Factory = require('../../util/factory');

class UserFunctions {

    constructor() {
        this.existingUsers = [];
    }

    async exists(where) {
        this.existingUsers = await Factory.models.user.find(where);
        return this.existingUsers.length > 0;
    }

    sendMobileVerificationCode(mobile) {
        let verificationCode = '';
        if (mobile) {
            verificationCode = Factory.helpers.getRandomString(6, true);
            let msg = `TickToss mobile verification code is ${verificationCode}`;
            Factory.helpers.sendSMS(msg, mobile, (res) => {
                console.log('twilio response => ', res.sid);
            });
        }
        return verificationCode;
    }

    async sendVerificationEmail(email, code) {
        let emailVerificationCode = '';
        if (email) {
            emailVerificationCode = (!code) ? await Factory.helpers.getRandomString(6, true):code;
            let target = '';
            let msg = '';
            if (!code) {
                target = await Factory.helpers.url(`verify-email/${emailVerificationCode}`);
                msg = `Hi<br>Please use ${emailVerificationCode} as your email verification code.`;
            }
            else {
                msg = `Hi<br>Please use ${code} as your password reset verification code.`;
            }
            Factory.helpers.sendMail(email, (!code) ? 'TickToss email verification':'Reset password code', msg);
        }
        return emailVerificationCode;
    }

    async handleSignup(req, res) {
        let user = {
            userName: req.body.userName,
            fullName: (req.body.fullName) ? req.body.fullName:'',
            email: (req.body.email) ? req.body.email:'',
            mobile: (req.body.mobile) ? req.body.mobile:'',
            gender: (req.body.gender) ? req.body.gender:'',
            password: bcrypt.hashSync(req.body.password, Factory.env.BCRYPT_SALT),
            lastSeenAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }, 
        that = this;
        if (await this.exists({userName: req.body.userName})) {
            return res.send(Factory.helpers.prepareResponse({
                success: false,
                message: req.__('Username already taken, try another'),
            }));
        }
        if (req.body.email) {
            if (await this.exists({email: req.body.email})) {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Email already taken, try another'),
                }));
            }
        }
        if (req.body.mobile) {
            if (await this.exists({mobile: req.body.mobile})) {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Mobile number exists, try another'),
                }));
            }
        }
        if (req.body.authMethod!='manual') {
            user[req.body.authMethod] = {id: req.body.id, accessToken: req.body.accessToken};
        }
        user.verificationCode = await this.sendMobileVerificationCode(req.body.mobile);
        user.emailVerificationCode = await this.sendVerificationEmail(req.body.email);
        Factory.models.user(user).save(async(err, newUser) => {
            if (err) {
                console.log(err);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Something went wrong, try later'),
                }));
            }
            else {
                return that.sendLoginResponse(res, newUser, req.__('Account created'));
            }
        });
    }

    prepareLoginResponse(req, res) {
        let aggregation = [], that = this;
        if (req.body.authMethod=='facebook' || req.body.authMethod=='instagram' || req.body.authMethod=='linkedin') {
            let match = {};
            match[req.body.authMethod+'.id'] = req.body.id;
            aggregation = [
                { $unwind: '$'+req.body.authMethod},
                {
                    $match: match
                },
                //{ $group: {_id: '$_id'}}
            ];
        }
        else {
            let match = {password: bcrypt.hashSync(req.body.password, Factory.env.BCRYPT_SALT)};
            if (req.body.userName) {
                match.userName = req.body.userName;
            }
            else if (req.body.email) {
                match.email = req.body.email;
            }
            else {
                match.mobile = req.body.mobile;
            }
            aggregation = [
                {$match: match}
            ];
        }
        Factory.models.user.aggregate(aggregation)
        .exec(async(err, user) => {
            if (err) {
                console.log(err);
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__('Something went wrong, try later'),
                }));
            }
            else if (user.length <= 0) {
                return res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: (req.body.id && req.body.accessToken) ? req.__('Please review your details'):req.__('Could not find your account.'),
                }));
            }
            else {
                user = await Factory.models.user.findOne({_id: user[0]._id})
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
                .exec();
                if (!user.mobileVerified) {
                    user.verificationCode = that.sendMobileVerificationCode(user.mobile);
                    user.updatedAt = new Date();
                    user.save((err, udata) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                return that.sendLoginResponse(res, user, req.__('Logged in'));
            }
        });
    }

    async sendLoginResponse(res, user, message) {
        let userData = await Factory.helpers.setDefaultValues(((typeof user.toObject=='function') ? user.toObject():user));
        let jwtData = {
            _id: userData._id
        };
        userData.token = jwt.sign(jwtData, new Buffer(Factory.env.JWT_SECRET, "base64"), {
            expiresIn: (1440*60) // 24 hours
        });
        res.send(Factory.helpers.prepareResponse({
            message: message,
            data: userData,
        }));
    }

}

module.exports = class UsersController {

    constructor() {
        this.userFunctions = new UserFunctions();
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.socialLogin = this.socialLogin.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
    }

    register(req, res) {
        let that = this,
        method = 'manual';
        if (req.body.authMethod) {
            method = req.body.authMethod;
        }
        req.checkBody('authMethod', 'The selected auth method is not allowed').isIn(['', 'manual', 'facebook', 'instagram', 'linkedin']);
        req.checkBody('userName', 'The username field is required').required()
        .isUsername().withMessage('The username is invalid').isLength(5).withMessage('The username is too short');
        if (req.body.email) {
            req.checkBody('email', 'The email field is required without mobile').requiredWithout(req.body.mobile)
            .isEmail().withMessage('The email is invalid');
        }
        else {
            req.checkBody('email', 'The email field is required without mobile').requiredWithout(req.body.mobile);
        }
        req.checkBody('mobile', 'The mobile field is required without email').requiredWithout(req.body.email).mobile().withMessage('The mobile number format is invalid');
        if (method!='facebook' && method!='instagram' && method!='linkedin') {
            req.checkBody('password', 'The password field is required').required().isLength(6).withMessage('The password is too short');
            req.checkBody('passwordConfirmation', 'The password confirmation field is required').required()
            .same(req.body.password).withMessage('The password confirmation must match');
        }
        else {
            req.checkBody('id', 'The ID field is required').required();
            req.checkBody('accessToken', 'The access token field is required').required();
        }
        req.checkBody('gender', 'The selected gender is invalid').isIn(['', 'male', 'female']);
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else { 
                that.userFunctions.handleSignup(req, res);
            }
        });
    }

    login(req, res) {
        let that = this, credentialsMissing = true;
        // lets let users login using userName/email/mobile
        if (req.body.userName) {
            credentialsMissing = false;
            req.checkBody('userName', 'The username field is required').required().isUsername().withMessage('The username is invalid');
        }
        if (req.body.email) {
            credentialsMissing = false;
            req.checkBody('email', 'The email field is required').required().isEmail().withMessage('The email is invalid');
        }
        if (req.body.mobile) {
            credentialsMissing = false;
            req.checkBody('mobile', 'The mobile field is required').required().mobile().withMessage('The mobile number format is invalid');
        }
        req.checkBody('password', 'The password field is required').required();
        if (!credentialsMissing) {
            req.getValidationResult().then((result) => {
                if (!result.isEmpty()) {
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__(result.array()[0].msg),
                    }));
                }
                else {
                    that.userFunctions.prepareLoginResponse(req, res);
                }
            });
        }
        else {
            res.send(Factory.helpers.prepareResponse({
                success: false,
                message: req.__('username/email/mobile is required with password')
            }));
        }
    }

    socialLogin(req, res) {
        let that = this;
        req.checkBody('id', 'The ID field is required').required();
        req.checkBody('accessToken', 'The access token field is required').required();
        req.checkBody('authMethod', 'The selected auth method is not allowed').isIn(['facebook', 'instagram', 'linkedin']);
        req.getValidationResult().then((result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                that.userFunctions.prepareLoginResponse(req, res);
            }
        });
    }

    forgotPassword(req, res) {
        let that = this;
        if (!req.body.mobile) {
            req.checkBody('email', 'The email field is required without mobile').required().isEmail().withMessage('The email is invalid');
        }
        else {
            req.checkBody('mobile', 'The mobile field is required without email').required().mobile().withMessage('The mobile number format is invalid');
        }
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let where = {};
                if (req.body.email) {
                    where.email = req.body.email;
                }
                else {
                    where.mobile = req.body.mobile;
                }
                if (await that.userFunctions.exists(where)) {
                    // send reset code at email/mobile
                    if (req.body.email) {
                        that.userFunctions.existingUsers[0].resetPasswordCode = await that.userFunctions.sendVerificationEmail(req.body.email, await Factory.helpers.getRandomString(6, true));
                    }
                    else {
                        that.userFunctions.existingUsers[0].resetPasswordCode = await that.userFunctions.sendMobileVerificationCode(req.body.mobile);
                    }
                    that.userFunctions.existingUsers[0].updatedAt = new Date();
                    that.userFunctions.existingUsers[0].save((err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    res.send(Factory.helpers.prepareResponse({
                        message: req.__('Reset code sent')
                    }));
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Could not find your account')
                    }));
                }
            }
        });
    }

    resetPassword(req, res) {
        let that = this;
        req.checkBody('resetPasswordCode', 'The reset password code is required').required();
        if (!req.body.mobile) {
            req.checkBody('email', 'The email field is required without mobile').required().isEmail().withMessage('The email is invalid');
        }
        else {
            req.checkBody('mobile', 'The mobile field is required without email').required().mobile().withMessage('The mobile number format is invalid');
        }
        req.checkBody('password', 'The password field is required').required().isLength(6).withMessage('The password is too short');
        req.checkBody('passwordConfirmation', 'The password confirmation field is required').required()
        .same(req.body.password).withMessage('The password confirmation must match');
        req.getValidationResult().then(async(result) => {
            if (!result.isEmpty()) {
                res.send(Factory.helpers.prepareResponse({
                    success: false,
                    message: req.__(result.array()[0].msg),
                }));
            }
            else {
                let where = {};
                if (req.body.email) {
                    where.email = req.body.email;
                }
                else {
                    where.mobile = req.body.mobile;
                }
                if (await that.userFunctions.exists(where)) {
                    if (that.userFunctions.existingUsers[0].resetPasswordCode===req.body.resetPasswordCode) {
                        // reset password
                        that.userFunctions.existingUsers[0].password = bcrypt.hashSync(req.body.password, Factory.env.BCRYPT_SALT);
                        that.userFunctions.existingUsers[0].resetPasswordCode = '';
                        that.userFunctions.existingUsers[0].updatedAt = new Date();
                        that.userFunctions.existingUsers[0].save((err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                        res.send(Factory.helpers.prepareResponse({
                            message: req.__('Password changed successfully')
                        }));
                    }
                    else {
                        res.send(Factory.helpers.prepareResponse({
                            success: false,
                            message: req.__('Reset code does not match')
                        }));
                    }
                }
                else {
                    res.send(Factory.helpers.prepareResponse({
                        success: false,
                        message: req.__('Could not find your account')
                    }));
                }
            }
        });
    }
}