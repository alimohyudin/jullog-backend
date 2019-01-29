
module.exports = {
    PORT: 3000,
    BASE_URL: 'http://localhost:3000',
    BCRYPT_SALT: "$2a$10$Xj0tGsIzvLKGqsSRUC6bK.",
    ENCRYPTION_SALT: "$2a$10$Xj0tGsIzvLKGqsSRUC6bK.",
    ENCRYPTION_ALGORITHM: 'aes-256-ctr',
    JWT_SECRET: "ueldOkGmguXx9MqkzM35P66NyDY5uB9Hab",
    RANDOM_STRING_LENGTH: 64,
    SESSION_MAX_LIFE: 24 * 60 * 60 * 1000, // 24 hours
    LOCALES: {
        en: {id: 1, title: "English"}, 
        ar: {id: 2, title: "عربى"},
        dk: {id: 3, title: "Dansk"}
    },
    //DEFAULT_LANGUAGE: "5a8c5d9ab6a6321a8c2359f7",

    I18N_LOCALES: ['en', 'ar', 'dk'],
    DEFAULT_LOCALE: 'dk',
    I18N_COOKIE_NAME: '123jullog_dk_i18n',
    LOCALES_DIRECTORY: '/locales',

    MONTHS: [
        "January", "February", "March", "April", 
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ],
    DAYS: [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    PATHS: {
        temp: "./assets/temp/",
        uploads: "./assets/uploads/"
    },

    TWILIO: {
        // SID: "AC71f5966d2fc4f353cce98c7e7abc3d0a",
        // TOKEN: "add1075be1b29d7e26f73d41106a0578",
        // FROM: "+1 857-293-6041",
    },

    BANDWIDTH: {
        // USER_ID: "u-5ej2ovt56f6ouyswn5qedji",
        // API_TOKEN: "t-lfn3qjmmrdu445syub4pgri",
        // API_SECRET: "up4555kxzq7zn44lmju6ef6ysl6azlhe6j25nti",
        // FROM: "(332) 333-1228"
    },

    MAIL: {
        // FROM: 'no-reply@ticktoss.com',
        // CONFIG: {
        //     sendmail: true,
        //     newline: "unix",
        //     path: "D:\\xampp7\\mailtodisk\\mailtodisk.exe",
        //     host: "localhost",
        //     port: 25,
        //     secure: false
        // }
    },

    PER_PAGE: {
        AREAS: 50,
        PRODUCTS: 50,
        ACTIVITIES: 50,
        
        ADMIN_AREAS: 50,
        ADMIN_PRODUCTS: 50,
        
        // USERS: 50,
        // FOLLOWERS: 100,
        // FOLLOWING: 100,
        // FRIENDS: 100,
        // PRIVATE_LOCKER_ITEMS: 100,
    },
};