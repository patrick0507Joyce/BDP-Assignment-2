const router = require("express").Router();
const fs = require("fs");
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const jsonChunkUploadHandle = require("../Tools/jsonChunkToolKits/jsonChunkUploadHandle");
const smallCsvUploadToDmsService = require("../Services/smallCsvUploadToDmsService");
const jsonStreamUploadToDmsService = require("../Services/jsonStreamUploadToDmsService");

router.post("/chunkIngest", (request, response) => {
  const fileName = request.query.fileName;
  const chunkCount = request.query.chunkCount;

  if (chunkCount % 100 === 0) {
    console.log(
      "fileName",
      request.query.fileName,
      "chunkCount",
      request.query.chunkCount
    );
  }
  jsonChunkUploadHandle(fileName, chunkCount, JSON.stringify(request.body));
});

router.post("/chunkIngestComplete", async (request, response) => {
  try {
    const collectionName = request.query.collectionName;
    const client = await jsonStreamUploadToDmsService.openDataBaseCollection(collectionName);
    const fileDirPath = process.env.TMP_DIR_PATH + request.query.fileName;
    let filesInDir = await jsonStreamUploadToDmsService.readAllJsonsInTmpDir(fileDirPath);
    let batchTransferResult = await jsonStreamUploadToDmsService.traverseChunkInTmpDir(filesInDir, client.collection);

    response.status(200).json({
      fileDirPath: fileDirPath,
      batchTransferResult: batchTransferResult,
      resultDbCollection: client.collection.collectionName,
    });
    client.close();
  } catch (error) {
    console.log(error)
    response.status(500).json({
      errorInfo: error,
    });
  }
});

router.post(
  "/batchIngest",
  fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
  async (request, response) => {
    try {
      let [
        dataPath,
        collectionName,
      ] = await smallCsvUploadToDmsService.checkFileAndCollectionStatus(
        request
      );
      let client = await smallCsvUploadToDmsService.openDataBaseCollection(
        collectionName
      );
      let transferData = await smallCsvUploadToDmsService.transferDataInStream(
        dataPath,
        client.collection
      );

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
