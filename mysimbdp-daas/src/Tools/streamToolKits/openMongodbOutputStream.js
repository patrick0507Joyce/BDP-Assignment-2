"use strict";

const stream = require("stream");

const openMongodbOutputStream = (dbCollection) => {
  let count = 0;
  const csvOutputStream = new stream.Writable({ objectMode: true, highWaterMark: 500 });
  csvOutputStream._writev = (chunks, callback) => {
    let chunkSize = JSON.stringify(chunks);
    if (chunks.length !== 0) {
      count++;
      dbCollection
        .insertMany(chunks, { ordered: false })
        .then(() => {
          callback();
        })
        .catch((err) => {
          console.log(chunks);
          callback(err);
        });
    } else {
      csvOutputStream.emit('dataCount', count);
      //csvOutputStream.emit("finish");
    }
  };
  return csvOutputStream;
};

module.exports = openMongodbOutputStream;
