const express = require("express");
const app = express();
const dotenv = require("dotenv");

//Import env
dotenv.config();

//Import Routes
const roomRoute = require('./src/Routes/roomsRoute');
const reviewRoute = require('./src/Routes/reviewsRoute');
const indexRoute = require('./src/Routes/indexRoute');
//middleware
app.use(express.json({ limit: '5mb' }));

//Route Middlewares
app.use('/rooms', roomRoute);
app.use('/reviews', reviewRoute);
app.use('/', indexRoute);

app.get('/', (request, response) => {
  response.send("connected!");
})

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
