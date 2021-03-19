const express = require("express");
const app = express();
const dotenv = require("dotenv");

//Import env
dotenv.config();

//Import Routes
const batchIngestRoute = require('./src/Routes/batchIngestRoute');
const streamIngestRoute = require('./src/Routes/streamIngestRoute');
//middleware
app.use(express.json({ limit: '5mb' }));

//amqp consuming
const consumeMessageApi = require('./src/API/consumeMessageApi');
consumeMessageApi();

//Route Middlewares
app.use('/batchMode', batchIngestRoute);
app.use('/streamMode', streamIngestRoute);

app.get('/', (request, response) => {
  response.send("connected!");
})

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
