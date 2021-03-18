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

const consumeMessage = async (messageChannel, topicName, handleMessage) => {
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
    async (msg) => {
      let messageContent = msg.content.toString();
      const transferMode = JSON.parse(messageContent).transferMode;
      if (transferMode === 'file') {
        let collectionName = JSON.parse(messageContent).collectionName;
        const client = await openDataBaseCollection(collectionName);
        await handleMessage(messageContent, client);
      } else {
        await handleMessage(messageContent);
      }
      console.log(
        "store success on: [x] %s [routingKey]",
        messageContent,
        msg.fields.routingKey
      );
      messageChannel.ack(msg);
    },
    {
      noAck: false,
    }
  );
};

const messageStoreIntoMongoDB = async (messageContent, fileModeClient) => {
   let client = null;
  const parsedMessageContent = JSON.parse(messageContent);

  const collectionName = parsedMessageContent.collectionName;
  const transferMode = parsedMessageContent.transferMode;

  let payLoadRecord = parsedMessageContent.message;
  let clientId = parsedMessageContent.clientId;

  if (transferMode === 'file') {
    payLoadRecord = parsedMessageContent;
    client = fileModeClient;
  } else {
    client = await openDataBaseCollection(collectionName);    
  }

  return new Promise((resolve, reject) => {
    if (payLoadRecord) {
      client.collection
        .insertOne(payLoadRecord)
        .then(() => {
          resolve(`store ${clientId}:${collectionName} db successfully`);
        })
        .catch((err) => {
          console.log("error info", err);
          reject(
            `store ${clientId}:${collectionName} db failed with error: ${err}`
          );
        });
    }
  });
};

module.exports = {
  openConnectWithMessageBroker,
  createChannelInConnection,
  consumeMessage,
  messageStoreIntoMongoDB,
};
