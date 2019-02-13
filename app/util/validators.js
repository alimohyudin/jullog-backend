module.exports = {
    isUsername: (param) => {
        return /^[a-zA-Z0-9]+([a-zA-Z0-9](_|-|)[a-zA-Z0-9])*[a-zA-Z0-9]+$/.test(param);
    },
    isNumeric: (param) => {
        if (param) {
            return /\-?\d+(\.\d+)?/.test(param);
        }
        return true;
    },
    isAlphaNumeric: (param) => {
        if (param) {
            return /^[0-9a-zA-Z ]+$/.test(param);
        }
        return true;
    },
    isObjectId: (param) => {
        if (param) {
            return /^[a-f\d]{24}$/.test(param);
        }
        return true;
    },
    same: (param, value) => {
        return param===value;
    },
    required: (param, file) => {
        if (param) {
            //it won't work if same parameter is sent twice as request.
            //or if its an array
            //console.log(param);
            let value = param.trim();
            return value.length > 0;
        }
        else if (typeof file == 'object') {
            return Object.keys(file).length > 0;
        }
        else {
            return false;
        }
    },
    requiredWithout: (param, otherParam) => {
        if (!param && !otherParam) {
            return false;
        }
        return true;
    },
    mobile: (param) => {
        if (param) {
            if (param.length > 0) {
                return /^(\+\d{1,4})?(?!0+\s+,?$)\d{3,12}\s*,?$/.test(param);
            }
        }
        return true;
    },
    hasImagesOrVideos: (value, files) => {
        let total = Object.keys(files).length;
        if (total > 0) {
            let validFileCount = 0;
            for (let i in files) {
                switch (files[i].mimetype) {
                    case 'image/jpg': 
                    case 'image/jpeg': 
                    case 'image/png':
                    case 'video/3gpp': 
                    case 'video/mp2t': 
                    case 'video/mp4':
                    case 'video/mpeg': 
                    case 'video/quicktime':
                    case 'video/webm': 
                    case 'video/x-flv':
                    case 'video/x-m4v': 
                    case 'video/x-mng':
                    case 'video/x-ms-asf': 
                    case 'video/x-ms-wmv':
                    case 'video/x-msvideo':
                        ++validFileCount;
                        break;
                    default:
                        --validFileCount;
                }
            }
            return validFileCount==total;
        }
        return false;
    },
    isImage: (value, mimetype) => {
        if (mimetype.length > 0) {
            switch (mimetype) {
                case 'image/jpg': 
                case 'image/jpeg': 
                case 'image/png':
                    return true;
                default:
                    return false;
            }
        }
        return true;
    },
    isVideo: (value, mimetype) => {
        if (mimetype.length > 0) {
            switch (mimetype) {
                case 'video/3gpp': 
                case 'video/mp2t': 
                case 'video/mp4':
                case 'video/mpeg': 
                case 'video/quicktime':
                case 'video/webm': 
                case 'video/x-flv':
                case 'video/x-m4v': 
                case 'video/x-mng':
                case 'video/x-ms-asf': 
                case 'video/x-ms-wmv':
                case 'video/x-msvideo':
                    return true;
                default:
                    return false;
            }
        }
        return true;
    },
};