const router = require("express").Router();
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const csvFileIngest = require("../Tools/dataBaseToolKits/csvFileIngest");
const jsonChunkUploadHandle = require("../Tools/jsonChunkToolKits/jsonChunkUploadHandle");
const fs = require("fs");
const openMongodbOutputStream = require("../Tools/streamToolKits/openMongodbOutputStream");
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");
const openJsonInputStream = require("../Tools/streamToolKits/openJsonFileInputStream");
const glob = require("glob");
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
const JSONStream      = require('JSONStream');

router.post("/chunkIngest", (request, response) => {
  const fileName = request.query.fileName;
  const chunkCount = request.query.chunkCount;

  //
  //console.log(JSON.stringify(request.body));

  if (chunkCount % 10 === 0) {
    console.log(
      "fileName",
      request.query.fileName,
      "chunkCount",
      request.query.chunkCount
    );
  }
  jsonChunkUploadHandle(fileName, chunkCount, JSON.stringify(request.body));
});

router.post("/chunkIngestComplete", (request, response) => {
  const fileDirPath = process.env.TMP_DIR_PATH + request.query.fileName;

  const fileName =
    process.env.TMP_DIR_PATH +
    request.query.fileName +
    "/" +
    request.query.fileName +
    ".json";

  console.log("complete upload on: ", +request.query.fileName);

  openDataBase(process.env.DB_NAME, request.query.collectionName)
    .then((client) => {
      const outputDBConfig = { dbURL: process.env.DB_CONNECT, collection: 'calendar' };
      const writableStream = streamToMongoDB(outputDBConfig);
      let count = 0;
      setInterval(() => {
        console.log("count:", count++);
        const used = process.memoryUsage();
        for (let key in used) {
          console.log(`OUTPUT: ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
      }, 5000);

      glob(fileDirPath + "/*.json", (err, files) => {
        const mongoOutputStream = openMongodbOutputStream(client.collection);

        files.map((fileName) => {
          fs.createReadStream(fileName)
          .pipe(JSONStream.parse('*'))
          .pipe(writableStream);

          
          /*
          const jsonInputStream = openJsonInputStream(fileName);
          jsonInputStream.pipe(mongoOutputStream);

          jsonInputStream.on("pipe", (src) => {
            console.log("Something is piping into the jsonInputStream.");
          });

          

          jsonInputStream.on('dataCount', (count) => {
            console.log("total count:", count);
          });
          */
        });
      });
    })
    .then(() => {
      //console.log("store into db successfully");
      client.close();
    })
    .catch((err) => {
      console.log("error info", err);
    });
});

router.post(
  "/batchIngest",
  fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
  (request, response) => {
    const collectionArr = ["reviews", "rooms", "hosts", "batch"];
    try {
      if (request.file == undefined) {
        return response.status(400).send("Please upload a CSV file!");
      }
      const dataPath = request.file.destination + request.file.filename;
      console.log({ dataPath });
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
  }
);

module.exports = router;
