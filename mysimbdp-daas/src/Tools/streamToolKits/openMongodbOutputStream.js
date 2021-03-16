"use strict";

const stream = require("stream");

const openMongodbOutputStream = (dbCollection) => {
  let count = 0;
  const csvOutputStream = new stream.Writable({ objectMode: true, highWaterMark:3 });
  
  csvOutputStream._write = (chunk, encoding, callback) => {
    count++;

    if (count % 20 === 0) {
      console.log("count:", count, "chunk length:", chunk.length, "writable length: ", csvOutputStream.writableLength);
      const used = process.memoryUsage();
      for (let key in used) {
        console.log(`OUTPUT: ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
    }

    if (chunk.length !== 0) {
      dbCollection
        .insertMany(chunk, { ordered: false })
        .then(() => {
          callback();
        })
        .catch((err) => {
          //console.log(chunk);
          callback(err);
        });
    } else {
      //csvOutputStream.emit('dataCount', count);
      //csvOutputStream.emit("finish");
    }
  };
  return csvOutputStream;
};

module.exports = openMongodbOutputStream;
