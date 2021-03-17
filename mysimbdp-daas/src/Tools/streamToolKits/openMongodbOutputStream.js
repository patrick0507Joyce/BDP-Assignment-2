"use strict";

const stream = require("stream");

const openMongodbOutputStream = (dbCollection, options) => {
  const config = Object.assign(
    // default config
    {
      batchSize: 100,
      insertOptions: { w: 1 },
    },
    // overrided options
    options
  );
  let recordBuffer = [];
  let rowCount = 0;
  const csvOutputStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 3,
  });

  csvOutputStream._write = (record, encoding, callback) => {
    rowCount++;

    if (rowCount % 5 === 0) {
      console.log(
        "count:",
        rowCount,
        "chunk length:",
        record.length,
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
        if (Array.isArray(record)) {
          recordBuffer.concat(record);
        } else {
          recordBuffer.push(record);
        }
        callback();
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
    try {
      if (recordBuffer.length > 0) {
        dbCollection.insertMany(recordBuffer, { ordered: false });
      }
      console.log("MONGO DONE");
      csvOutputStream.emit("close");
    } catch (error) {
      csvOutputStream.emit("error", error);
    }
  });

  return csvOutputStream;
};

module.exports = openMongodbOutputStream;
