let env = require('./config/env'),
express = require('express'),
app = express(),
i18n = require('i18n'),
bodyParser = require('body-parser'),
expressValidator = require('express-validator'),
fileSystem = require('fs'),
redisClient = {}, //require('redis').createClient(),
mongoose = require('mongoose'),
cors = require('cors');

// let https = require('https'),
// fs = require('fs'),
// keys_dir = 'keys/',
// server_options = {
//     key  : fs.readFileSync('/certificates/privkey.pem'),
//     cert : fs.readFileSync('/certificates/fullchain.pem')
// }



/*
 * DB CONNECTION
 */
mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://213.136.72.86:27017/tender-app');
//mongoose.connect('mongodb://173.212.224.132:27017/tender-app');
//mongoose.connect('mongodb://mongo/tender-app');
mongoose.connect('mongodb://127.0.0.1:27017/tender-app', { useNewUrlParser: true });
let models = require('./models/db'),
validators = require('./util/validators'),
Factory = require('./util/factory');
Factory.env = env;
Factory.models = models;
Factory.redisClient = redisClient;
Factory.validators = validators;

// utilities
let helpers = new (require('./util/helpers')),
connectionListener = new (require('./controllers/socketListeners/connectionListener'));
Factory.helpers = helpers;

// middlewares
let apiMiddlewares = require('./middleware/apiMiddlewares'),
socketMiddleware = require('./middleware/socketMiddleware'),
// routers
apiRouter = require('./routes/api/apiRouter')(express.Router()),
frontendRouter = require('./routes/frontend/frontendRouter')(express.Router()),
multer = require('multer'),
http = require('http'),
socketIO = require('socket.io');

console.log(env.I18N_LOCALES+","+__dirname+env.LOCALES_DIRECTORY+","+env.DEFAULT_LOCALE+","+env.I18N_COOKIE_NAME)
i18n.configure({
    locales: env.I18N_LOCALES,
    directory: __dirname+env.LOCALES_DIRECTORY,
    defaultLocale: env.DEFAULT_LOCALE,
    cookie: env.I18N_COOKIE_NAME,
    //register: helper.translator
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({dest: env.PATHS.temp}).fields([
    {name: "profilePhoto", maxCount: 1},
    {name: "coverPhoto", maxCount: 1},
    {name: "image", maxCount: 1},
    {name: "media", maxCount: 10},
]));

app.use(expressValidator({customValidators: validators}));

// app.use(cookieSession({
//     name: 'session',
//     keys: [env.BCRYPT_SALT],
//     // Cookie Options
//     maxAge: env.SESSION_MAX_LIFE
// }));
//app.use(cookieParser());
app.use(i18n.init);
app.use("/assets", express.static(__dirname + './../assets'));



//https.createServer(server_options,app).listen(7000);



let server = http.createServer(app);
server.listen(env.PORT);
Factory.socketIO = socketIO.listen(server, {
    transports: ['websocket', 'polling']
});
Factory.socketIO.use(socketMiddleware);
Factory.socketIO.on('connect', connectionListener.connected);
console.log(`server running at: ${env.BASE_URL}`);

// all authenticated routes will have /auth prefix
app.use('/api/auth', apiMiddlewares.auth);
app.use('/api', apiRouter);

app.use('/beta', frontendRouter);