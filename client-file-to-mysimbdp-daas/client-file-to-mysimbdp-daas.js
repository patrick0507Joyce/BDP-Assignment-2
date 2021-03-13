const axios = require("axios");
const yargs = require("yargs/yargs");
const fs = require("fs");
const FormData = require("form-data");

const argv = yargs(process.argv.slice(2)).argv;

let serverAddress = argv.serverAddress
  ? argv.serverAddress
  : "http://51.143.2.0:3001";
serverAddress += "/batchIngest";

let dataPath = "./client-stage-directory/" + argv.dataPath;
let collectionName = argv.collectionName;
let clientId = argv.clientId;

let bodyFormData = new FormData();
bodyFormData.append("csvFile", fs.createReadStream(dataPath));
bodyFormData.append("collectionName", collectionName);
bodyFormData.append('clientId', clientId);

console.log({ bodyFormData });

if (dataPath) {
  axios
    .post(serverAddress, bodyFormData, {
      headers: bodyFormData.getHeaders()
    })
    .then((res) => {
      console.log(`statusCode: ${res.statusCode}`);
      //console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
}

//example: node client-file-to-mysimbdp-daas.js --dataPath=reviews-stockholm-1.csv --collectionName=reviews --clientId=1
//clientbatchingestapp