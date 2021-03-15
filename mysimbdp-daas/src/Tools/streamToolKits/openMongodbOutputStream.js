"use strict";

const stream = require("stream");

const openMongodbOutputStream = (dbCollection) => {
  const csvOutputStream = new stream.Writable({ objectMode: true });
  csvOutputStream._write = (chunk, encoding, callback) => {
    if (chunk.length !== 0) {
      dbCollection
        .insert(chunk, { ordered: false })
        .then(() => {
          callback();
        })
        .catch((err) => {
          console.log(chunk);
          callback(err);
        });
    } else {
      csvOutputStream.emit("finish");
    }
  };
  return csvOutputStream;
};

module.exports = openMongodbOutputStream;
