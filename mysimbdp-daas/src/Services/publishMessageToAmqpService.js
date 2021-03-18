const amqp = require("amqplib");

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

module.exports = {
  openConnectWithMessageBroker,
  createChannelInConnection,
  publishMessage,
};
