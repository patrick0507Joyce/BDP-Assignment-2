const router = require("express").Router();
const fs = require("fs");
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const jsonChunkUploadHandle = require("../Tools/jsonChunkToolKits/jsonChunkUploadHandle");
const {
  transferDataInStream,
  checkFileAndCollectionStatus,
  openDataBaseCollection,
} = require("../Services/smallCsvUploadToDmsService");

router.post("/chunkIngest", (request, response) => {
  const fileName = request.query.fileName;
  const chunkCount = request.query.chunkCount;

  //console.log(JSON.stringify(request.body));

  if (chunkCount % 100 === 0) {
    console.log(
      "fileName",
      request.query.fileName,
      "chunkCount",
      request.query.chunkCount
    );
  }
  //jsonChunkUploadHandle(fileName, chunkCount, JSON.stringify(request.body));
});

router.post("/chunkIngestComplete", async (request, response) => {
  try {
    let result = await jsonChunkUploadHandle(request);
    return response.status(200).json({
      result: result,
    });
  } catch (err) {
    return response.status(500).json({
      errorInfo: err,
    });
  }
});

router.post(
  "/batchIngest",
  fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
  async (request, response) => {
    try {
      let [dataPath, collectionName] = await checkFileAndCollectionStatus(request);
      let client = await openDataBaseCollection(collectionName);
      let transferData = await transferDataInStream(dataPath, client.collection);
      
      console.log({transferData});
      response.status(200).json({
        resultDbCollection: client.collection.collectionName,
      });

      client.close();
      

    } catch (error) {
      console.log(error);
      response.status(500).json({
        message: "Could not upload the file: " + request.file.originalname,
        errorInfo: error,
      });
    }
  }
);

module.exports = router;
