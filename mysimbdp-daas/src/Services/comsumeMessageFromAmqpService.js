const amqp = require("amqplib");
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");

const openDataBaseCollection = (collectionName) => {
  return new Promise((resolve, reject) => {
    openDataBase(process.env.DB_NAME, collectionName)
      .then((client) => {
        resolve(client);
      })
      .catch((err) => {
        console.log("error info", err);
        reject(err);
      });
  });
};

const openConnectWithMessageBroker = () => {
  return amqp.connect(process.env.RABBIT);
};

const createChannelInConnection = (amqpConnection) => {
  return amqpConnection.createChannel();
};

const consumeMessage = async (messageChannel, topicName, callback) => {
  const exchangeName = process.env.MESSAGE_QUEUE_EXCHANGE;

  await messageChannel.assertExchange(exchangeName, "topic", {
    durable: false,
  });

  const assertQueueRes = await messageChannel.assertQueue("", {
    exclusive: true,
  });

  const queue = assertQueueRes.queue;

  console.log(
    `Created queue ${queue}, binding it to ${exchangeName} exchange.`
  );

  await messageChannel.bindQueue(
    queue,
    exchangeName,
    topicName || process.env.MESSAGE_QUEUE_TOPIC
  );

  messageChannel.consume(
    queue,
    (msg) => {
      console.log(
        " [x] %s [routingKey]",
        msg.content.toString(),
        msg.fields.routingKey
      );
      callback(msg.content.toString());
      messageChannel.ack(msg);
    },
    {
      noAck: false,
    }
  );
};

const consumeMessageCallback = async (msg) => {
  const msgContent = JSON.parse(msg);
  const payLoadRecord = msgContent.message;
  const clientId = msgContent.clientId;
  const collectionName = msgContent.collectionName;

  try {
    await messageStoreIntoMongoDB(
      clientId,
      collectionName,
      payLoadRecord
    );
    console.log("store success on:", msg);
  } catch (error) {
    console.log(error);
  }
};

const messageStoreIntoMongoDB = async (
  clientId,
  collectionName,
  payLoadRecord
) => {
  let client = await openDataBaseCollection(collectionName);

  return new Promise((resolve, reject) => {
    if (payLoadRecord) {
      client.collection
        .insertOne(payLoadRecord)
        .then(() => {
          resolve(`store ${clientId}:${collectionName} db successfully`);
        })
        .catch((err) => {
          console.log("error info", err);
          reject(err);
        });
    }
  });
};

module.exports = {
  openConnectWithMessageBroker,
  createChannelInConnection,
  consumeMessage,
  consumeMessageCallback,
  messageStoreIntoMongoDB,
};
