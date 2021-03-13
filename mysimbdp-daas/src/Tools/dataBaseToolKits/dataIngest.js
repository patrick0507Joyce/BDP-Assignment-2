const openCsvInputStream = require("../streamToolKits/openCsvInputStream");
const openMongodbOutputStream = require("../streamToolKits/openMongodbOutputStream");
const openDataBase = require("./openDataBase");

const streamCsvData = (inputFilePath, dbCollectionName) => {
  return new Promise((resolve, reject) => {
    openCsvInputStream(inputFilePath)
      .pipe(openMongodbOutputStream(dbCollectionName))
      .on("finish", () => {
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const storeDataset = (inputFilePath, collectionName, callback) => {
  openDataBase(process.env.DB_NAME, collectionName)
    .then(client => {
      return streamCsvData(inputFilePath, client.collection).then(() =>
        client.close()
      );
    })
    .then(() => {
      console.log("store into db successfully");
      callback();
    })
    .catch((err) => {
      console.log("error info", err);
      callback(err);
    });
};

module.exports = storeDataset;
