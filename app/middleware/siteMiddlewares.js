let siteRoutes = require('./../config/siteRoutes');
module.exports = {
    auth: (req, res, next) => {
        /*
        * DO NOT UPDATE THE KEYS IF ANY SCRIPT/ASSET IS REQUESTED
        */
        // if (req.path.search('/scripts') < 0 && req.path.search('/assets') < 0) {
        //     req.session.jsKey = helper.getRandomString();
        // }
        if (siteRoutes.indexOf(req.path) >= 0) {
            // authenticated route
            if (req.session.USER_DATA) {
                return next();
            }
            else {
                return res.redirect('/login');
            }
        }
        else {
            if (req.path=='/login' || req.path=='/signup' || req.path=='/forgot-password') {
                if (req.session.USER_DATA) {
                    return res.redirect('/');
                }
            }
            return next();
        }
    }
};