const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const clientFileToMysimbdpDaas = (fileName) => {
  if (!fileName) {
    return;
  }

  let serverAddress = process.env.SERVER_ADDRESS;

  let dataPath = process.env.DATA_DIRECTORY + fileName;
  let collectionName = process.env.COLLECTION_NAME;
  let clientId = process.env.CLIENT_ID;

  let bodyFormData = new FormData();
  bodyFormData.append("csvFile", fs.createReadStream(dataPath));
  bodyFormData.append("collectionName", collectionName);
  bodyFormData.append("clientId", clientId);

  console.log({ dataPath });

  if (dataPath) {
    axios
      .post(serverAddress, bodyFormData, {
        headers: bodyFormData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      })
      .then((res) => {
        console.log(`statusCode: ${res.status}, resBody: ${JSON.stringify(res.data)}`);
      })
      .catch((error) => {
        console.error(error);
      });
  }
};

module.exports = clientFileToMysimbdpDaas;

//example: node client-file-to-mysimbdp-daas.js --dataPath=reviews-stockholm-1.csv --collectionName=reviews --clientId=1
//clientbatchingestapp
