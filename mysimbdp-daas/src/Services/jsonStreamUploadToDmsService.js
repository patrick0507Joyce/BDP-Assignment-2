const JSONStream = require("JSONStream");
const openMongodbOutputStream = require("../Tools/streamToolKits/openMongodbOutputStream");
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");
const glob = require("glob");
const fs = require("fs-extra");

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

const readAllJsonsInTmpDir = (fileDirPath) => {
    return new Promise((resolve, reject) => {
        glob(fileDirPath + "/*.json", (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    })
}

const traverseChunkInTmpDir = (files, clientCollection) => {
  return Promise.all(
    files.map(async (fileName) => {
      return tranferSingleChunkInStream(fileName, clientCollection);
    })
  );
};

const tranferSingleChunkInStream = (filePath, clientCollection) => {
  return new Promise((resolve, reject) => {
    const jsonInputFileStream = fs.createReadStream(filePath);
    const mongodbOutputStream = openMongodbOutputStream(clientCollection);
    jsonInputFileStream.pipe(JSONStream.parse("*")).pipe(mongodbOutputStream);

    mongodbOutputStream.on("close", () => {
      resolve(filePath);
    });

    jsonInputFileStream.on("error", (err) => {
      reject(err);
    });

    mongodbOutputStream.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = {
  openDataBaseCollection,
  traverseChunkInTmpDir,
  readAllJsonsInTmpDir,
  tranferSingleChunkInStream
};
