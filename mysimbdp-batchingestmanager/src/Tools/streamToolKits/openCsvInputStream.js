"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true, highWaterMark:100 });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  let chunkCount = 0;
  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {  
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    step: (results) => {
      chunkCount++;      
      for (let row of results.data) {
        csvInputStream.push(row);    
      }  
    },

    complete: () => {
      csvInputStream.push(null);
      console.log("csv reading DONE");
      const used = process.memoryUsage();
      for (let key in used) {
        console.log(`INPUT: ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
      
    },

    error: (err) => {
      csvInputStream.emit("error", err);
    },
  });

  return csvInputStream;
};

module.exports = openCsvInputStream;
