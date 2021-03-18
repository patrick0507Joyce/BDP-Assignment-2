const amqp = require("amqplib");
const openCsvInputStream = require("../Tools/streamToolKits/openCsvInputStream");

const openConnectWithMessageBroker = () => {
  return amqp.connect(process.env.RABBIT);
};

const createChannelInConnection = (amqpConnection) => {
  return amqpConnection.createChannel();
};

const publishMessage = (messageChannel, topicName, payloadMsg) => {
  const exchangeName = process.env.MESSAGE_QUEUE_EXCHANGE;

  messageChannel.assertExchange(exchangeName, "topic", {
    durable: false,
  });

  return messageChannel.publish(
    exchangeName,
    topicName,
    Buffer.from(JSON.stringify(payloadMsg)),
    {
      contentType: "application/json",
    }
  );
};

const publishEachRecordToBroker = (
  amqpChannel,
  collectionName,
  clientId,
  topicName,
  dataPath,
  publishMessage
) => {
  return new Promise((resolve, reject) => {
    const csvInputStream = openCsvInputStream(dataPath);

    csvInputStream.on("data", (singleMessage) => {
        singleMessage['collectionName'] = collectionName;
        singleMessage['transferMode'] = 'file';
        singleMessage['clientId'] = clientId;
      publishMessage(amqpChannel, topicName, singleMessage);
    });

    csvInputStream.on("close", () => {
      resolve(dataPath);
    });

    csvInputStream.on("end", () => {
      resolve(dataPath);
    });

    csvInputStream.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = {
  openConnectWithMessageBroker,
  createChannelInConnection,
  publishMessage,
  publishEachRecordToBroker,
};
