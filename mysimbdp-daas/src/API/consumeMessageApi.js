const consumeMessageFromAmqpService = require('../Services/comsumeMessageFromAmqpService')

const consumeMessageApi = async () => {
    try {

        const amqpConnection = await consumeMessageFromAmqpService.openConnectWithMessageBroker();

        const amqpChannel = await consumeMessageFromAmqpService.createChannelInConnection(amqpConnection);

        const topicName = process.env.MESSAGE_QUEUE_TOPIC;

        const callback = consumeMessageFromAmqpService.consumeMessageCallback;

        consumeMessageFromAmqpService.consumeMessage(amqpChannel, topicName, callback);
    } catch (error) {
        console.log(error);
    }
}

module.exports = consumeMessageApi;