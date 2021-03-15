"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  let chunkCount = 0;
  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    chunk: (results) => {
      chunkCount++;
      if (chunkCount % 200 === 0) {
        console.log("input file path", inputFilePath, "chunk input: ", results.data.length, " chunkCount:", chunkCount);
      }

      csvInputStream.push(results.data); // Push results as they are streamed from the file.                
    },

    complete: () => {
      csvInputStream.push(null);
    },

    error: (err) => {
      csvInputStream.emit("error", err);
    },
  });

  return csvInputStream;
};

module.exports = openCsvInputStream;
