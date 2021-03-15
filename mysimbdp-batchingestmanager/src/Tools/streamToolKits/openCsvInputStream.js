"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true, highWaterMark:500 });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  let chunkCount = 0;
  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    step: (result) => {
      chunkCount++;

      csvInputStream.push(result.data); // Push results as they are streamed from the file.                
    },

    complete: () => {
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
