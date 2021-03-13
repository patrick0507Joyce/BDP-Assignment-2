const multer = require("multer");
const fs = require('fs-extra');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        //const type = file.mimetype;
        const path = `./tmp-client-stage-directory/`;
        //fs.mkdirsSync(path);
        callback(null, path);
      },
      filename: (req, file, callback) => {
        //originalname is the uploaded file's name with extn
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        callback(null, `${uniqueSuffix}-${file.originalname}`);
        //callback(null, `${file.originalname}`);
      }
});

const csvFilter = (req, file, callback) => {
    if (file.mimetype.includes("csv") || file.mimetype.includes("json")) {
      callback(null, true);
    } else {
      callback("Please upload csv/json file.", false);
    }
  };

const upload = multer({ storage: storage, fileFilter: csvFilter });

module.exports = upload;

