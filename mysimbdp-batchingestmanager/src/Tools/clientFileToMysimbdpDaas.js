const { default: axios } = require('axios');
const { request } = require('express');
const openCsvInputStream = require('./streamToolKits/openCsvInputStream')
const postJsonInputStream = require('./streamToolKits/postJsonInputStream');
const clientFileToMysimbdpDaas = (fileName) => {
  if (!fileName) {
    return;
  }

  let dataPath = process.env.DATA_DIRECTORY + fileName;

  openCsvInputStream(dataPath)
  .pipe(postJsonInputStream(fileName));
};

module.exports = clientFileToMysimbdpDaas;

//example: node client-file-to-mysimbdp-daas.js --dataPath=reviews-stockholm-1.csv --collectionName=reviews --clientId=1
//clientbatchingestapp
