const openCsvInputStream = require("../Tools/streamToolKits/openCsvInputStream");
const openMongodbOutputStream = require("../Tools/streamToolKits/openMongodbOutputStream");
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");

const checkFileAndCollectionStatus = (request) => {
  const collectionArr = ["reviews", "rooms", "hosts", "batch"];
  return new Promise((resolve, reject) => {
    if (!request.file) {
      reject("Please upload a CSV file!");
    }

    const dataPath = request.file.destination + request.file.filename;
    let collectionName = request.body.collectionName;

    if (!collectionArr.includes(collectionName)) {
      reject("Please check your collectionName!");
    }
    resolve([dataPath, collectionName]);
  });
};

const openDataBaseCollection = (collectionName) => {
  return new Promise((resolve, reject) => {
    openDataBase(process.env.DB_NAME, collectionName)
      .then((client) => {
        resolve(client);
      })
      .catch((err) => {
        console.log("error info", err);
        client.close();
      });
  });
};

const transferDataInStream = (dataPath, clientCollection) => {
  return new Promise((resolve, reject) => {
    const csvInputStream = openCsvInputStream(dataPath);
    const mongodbOutputStream = openMongodbOutputStream(clientCollection);
    csvInputStream.pipe(mongodbOutputStream);

    mongodbOutputStream.on("close", () => {
        resolve(dataPath);
    });

    mongodbOutputStream.on("end", () => {
        resolve(dataPath);
    });

    csvInputStream.on("error", (err) => {
      reject(err);
    });
    mongodbOutputStream.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = {
  transferDataInStream,
  checkFileAndCollectionStatus,
  openDataBaseCollection,
};
