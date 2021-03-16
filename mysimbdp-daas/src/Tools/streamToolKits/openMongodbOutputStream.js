"use strict";

const stream = require("stream");

const openMongodbOutputStream = (dbCollection) => {
  const config = Object.assign(
    // default config
    {
      batchSize: 500,
      insertOptions: { w: 1 },
    },
    // overrided options
    options
  );
  let recordBuffer = 0;
  let count = 0;
  const csvOutputStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 3,
  });

  csvOutputStream._write = (record, encoding, callback) => {
    count++;

    if (count % 2000 === 0) {
      console.log(
        "count:",
        count,
        "chunk length:",
        chunk.length,
        "writable length: ",
        csvOutputStream.writableLength
      );
      const used = process.memoryUsage();
      for (let key in used) {
        console.log(
          `OUTPUT: ${key} ${
            Math.round((used[key] / 1024 / 1024) * 100) / 100
          } MB`
        );
      }
    }

    if (record !== null) {
      if (recordBuffer.length < config.batchSize) {
        recordBuffer.push(record);
      } else {
        dbCollection
          .insertMany(recordBuffer, { ordered: false })
          .then(() => {
            recordBuffer = [];
            callback();
          })
          .catch((err) => {
            //console.log(chunk);
            callback(err);
          });
      }
    }
  };
  csvOutputStream.on("finish", () => {
    if (recordBuffer.length > 0) {
      dbCollection
        .insertMany(recordBuffer, { ordered: false })
        .then(() => {
          recordBuffer = [];
          callback();
          console.log("------------------------------------------");
        })
        .catch((err) => {
          //console.log(chunk);
          callback(err);
        });
    }
  });
  return csvOutputStream;
};

module.exports = openMongodbOutputStream;
