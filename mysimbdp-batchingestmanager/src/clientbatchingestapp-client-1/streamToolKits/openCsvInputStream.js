"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true, highWaterMark:5 });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  let chunkCount = 0;
  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {  
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    chunk: (results) => {
      chunkCount++;      
      if ( chunkCount % 2000 === 0 ) {
        console.log(
          "chunk length",
          results.data.length,
          "input stream:",
          chunkCount,
          "readable size:",
          csvInputStream.readableLength

        );
      }
      csvInputStream.push(results.data);    
      
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
