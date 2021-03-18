const router = require("express").Router();
const publishMessageToAmqpService = require("../Services/publishMessageToAmqpService");

router.post("/singleMessage", async (request, response) => {
  const singleMessage = request.body;

  try {
    const amqpConnection = await publishMessageToAmqpService.openConnectWithMessageBroker();

    const amqpChannel = await publishMessageToAmqpService.createChannelInConnection(amqpConnection);

    const topicName = "stat.allocation";

    const publishMessage = await publishMessageToAmqpService.publishMessage(
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

module.exports = router;