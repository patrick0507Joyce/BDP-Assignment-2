"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true, highWaterMark:1500 });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  let chunkCount = 0;
  let resultBuffer = [];
  let bufferCount = 0;
  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    step: (result) => {
      chunkCount++;
      resultBuffer.push(result.data);
      if ( chunkCount == 1500) {
        bufferCount++;
        //console.log(typeof(resultBuffer));
        //console.log("[x]", bufferCount * 500);
        csvInputStream.push(resultBuffer); // Push results as they are streamed from the file.
        resultBuffer = [];
        chunkCount = 0;
      }    
    },

    complete: () => {
      resultBuffer.push(resultBuffer);
      console.log("csv reading DONE");
      csvInputStream.push(null);
    },

    error: (err) => {
      csvInputStream.emit("error", err);
    },
  });

  return csvInputStream;
};

module.exports = openCsvInputStream;
