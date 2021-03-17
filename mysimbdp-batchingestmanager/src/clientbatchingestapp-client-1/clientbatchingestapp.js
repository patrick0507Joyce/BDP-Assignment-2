const openCsvInputStream = require("./streamToolKits/openCsvInputStream");
const postJsonInputStream = require("./streamToolKits/postJsonInputStream");

const clientbatchingestapp = (fileName) => {
  if (!fileName) {
    return;
  }

  const dataPath = process.env.DATA_DIRECTORY + fileName;

  const csvInputStream = openCsvInputStream(dataPath);
  const jsonInputStream = postJsonInputStream(fileName);

  csvInputStream.pipe(jsonInputStream);
};

module.exports = clientbatchingestapp;

//example: node client-file-to-mysimbdp-daas.js --dataPath=reviews-stockholm-1.csv --collectionName=reviews --clientId=1
//clientbatchingestapp
