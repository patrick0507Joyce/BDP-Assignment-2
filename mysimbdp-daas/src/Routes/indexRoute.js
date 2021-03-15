const router = require("express").Router();
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const csvFileIngest = require("../Tools/dataBaseToolKits/csvFileIngest");
const jsonChunkUploadHandle = require("../Tools/jsonChunkToolKits/jsonChunkUploadHandle")
const fs = require("fs");
const multistream = require('multistream');
const openMongodbOutputStream = require("../Tools/streamToolKits/openMongodbOutputStream")
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase")
const openJsonInputStream = require("../Tools/streamToolKits/openJsonFileInputStream")
const JSONStream = require('JSONStream')

router.post("/chunkIngest", (request, response) => {
  const fileName = request.query.fileName;
  const chunkCount = request.query.chunkCount;

  //
  //console.log(JSON.stringify(request.body));
  
  if (request.query.chunkCount % 5000 === 0) {
    console.log("fileName", request.query.fileName, "chunkCount", request.query.chunkCount);
    jsonChunkUploadHandle(fileName, chunkCount, JSON.stringify(request.body));
  }
});

router.post("/chunkIngestComplete", (request, response) => {
  const fileDirPath = process.env.TMP_DIR_PATH + request.query.fileName + '/' + request.query.fileName + '.json';
  const chunkCount = request.query.chunkCount;

  console.log("complete upload on: ",  + request.query.fileName);

  openDataBase(process.env.DB_NAME, request.query.collectionName)
    .then(client => {
      
      const jsonInputStream = openJsonInputStream(fileDirPath);
      const mongoOutputStream = openMongodbOutputStream(client.collection);
      jsonInputStream.pipe(mongoOutputStream);


      jsonInputStream.on('pipe', src => {
        console.log('Something is piping into the jsonInputStream.');
      })

      mongoOutputStream.on('finish', src => {
        console.log('finishing writing to MongoDB');
      })

      mongoOutputStream.on('dataCount', count => {
        console.log('total count:', count);
      })
    })
    .then(() => {
      //console.log("store into db successfully");
    })
    .catch((err) => {
      console.log("error info", err);
    });
  
})

router.post("/batchIngest",fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
 (request, response) => {
  const collectionArr = ["reviews", "rooms", "hosts", "batch"];
    try {
      if (request.file == undefined) {
        return response.status(400).send("Please upload a CSV file!");
      }
      const dataPath = request.file.destination + request.file.filename;
      console.log({dataPath});
      let collectionName = request.body.collectionName;

      if (!collectionArr.includes(collectionName)) {
        return response.status(400).send("Please check your collectionName!");
      }

      csvFileIngest(dataPath, collectionName, (err) => {
        if (err) {
          console.log("error on the way", err);
          response.status(500).send({
            message:
              "upload the file failed on the way: " + request.file.originalname,
          });
        }
        fs.unlinkSync(dataPath);
        response.status(200).json({
          "fileName:": request.file.originalname,
        });
      });
    } catch (error) {
      console.log(error);
      response.status(500).send({
        message: "Could not upload the file: " + request.file.originalname,
      });
    }
});

module.exports = router;
