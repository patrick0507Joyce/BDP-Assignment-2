const router = require("express").Router();
const publishMessageToAmqpService = require("../Services/publishMessageToAmqpService");
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const smallCsvUploadToDmsService = require("../Services/smallCsvUploadToDmsService");

router.post("/singleMessage", async (request, response) => {
  const singleMessage = request.body;

  try {
    const amqpConnection = await publishMessageToAmqpService.openConnectWithMessageBroker();

    const amqpChannel = await publishMessageToAmqpService.createChannelInConnection(amqpConnection);

    const topicName = "stat.allocation";

    const publishMessage = publishMessageToAmqpService.publishMessage(
      amqpChannel,
      topicName,
      singleMessage
    );

    response.status(200).json({
        publishMessage: publishMessage
      });
  } catch (error) {
    response.status(500).json({
      errorInfo: error,
    });
  }
});

router.post(
    "/smallFileIngest",
    fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
    async (request, response) => {
      try {
        let [
          dataPath,
          collectionName,
        ] = await smallCsvUploadToDmsService.checkFileAndCollectionStatus(
          request
        );

        const amqpConnection = await publishMessageToAmqpService.openConnectWithMessageBroker();

        const amqpChannel = await publishMessageToAmqpService.createChannelInConnection(amqpConnection);

        const topicName = "stat.allocation";

        const publishMessage = publishMessageToAmqpService.publishMessage;

        const clientId = request.body.clientId;

        let csvPulishResult =  await publishMessageToAmqpService.publishEachRecordToBroker(amqpChannel, collectionName, clientId, topicName, dataPath, publishMessage);

  
        response.status(200).json({
            csvPulishResult: csvPulishResult,
        });
  
      } catch (error) {
        console.log(error);
        response.status(500).json({
          message: "Could not publishing and consuming the file: " + request.file.originalname,
          errorInfo: error,
        });
      }
    }
  );

module.exports = router;