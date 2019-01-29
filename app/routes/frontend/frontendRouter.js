let Factory = require('../../util/factory'),
path = require('path');

module.exports = (router) => {
    // require all FORNTEND controllers here
    // register routes and return router
    
    router.get('*', (req, res) => {
        // res.send(path.join(__dirname, '../../../'+Factory.env.PATHS.site+'index.html'));
        res.sendFile(path.join(__dirname, '../../../assets/site/index.html'));
    });
    
    return router;
};