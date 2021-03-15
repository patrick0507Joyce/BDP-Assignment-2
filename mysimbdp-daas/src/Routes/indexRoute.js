const router = require("express").Router();
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const dataIngest = require("../Tools/dataBaseToolKits/dataIngest.js");
const chunkIngest = require("../Tools/dataBaseToolKits/chunkIngest");
const jsonChunkUploadHandle = require("../Tools/jsonChunkToolKits/jsonChunkUploadHandle")
const fs = require("fs");

router.post("/chunkIngest", (request, response) => {
  //chunkIngest(request.body, request.query.chunkCount, request.query.collectionName);
  const fileName = request.query.fileName;
  const chunkCount = request.query.chunkCount;

  jsonChunkUploadHandle(fileName, chunkCount, JSON.stringify(request.body));
  if (request.query.chunkCount % 200 === 0) {
    console.log("fileName", request.query.fileName, "chunkCount", request.query.chunkCount);
  }
});

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

      dataIngest(dataPath, collectionName, (err) => {
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
