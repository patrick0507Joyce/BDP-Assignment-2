const consumeMessageFromAmqpService = require('../Services/comsumeMessageFromAmqpService')

const consumeMessageApi = async () => {
    try {

        const amqpConnection = await consumeMessageFromAmqpService.openConnectWithMessageBroker();

        const amqpChannel = await consumeMessageFromAmqpService.createChannelInConnection(amqpConnection);

        const topicName = process.env.MESSAGE_QUEUE_TOPIC;

        const handleMessage = consumeMessageFromAmqpService.messageStoreIntoMongoDB;

        consumeMessageFromAmqpService.consumeMessage(amqpChannel, topicName, handleMessage);


    } catch (error) {
        console.log(error);
    }
}

module.exports = consumeMessageApi;