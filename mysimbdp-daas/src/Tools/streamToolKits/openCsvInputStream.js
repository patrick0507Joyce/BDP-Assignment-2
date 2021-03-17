"use strict";

const stream = require("stream");
const fs = require("fs");
const papaparse = require("papaparse");

const openCsvInputStream = (inputFilePath) => {
  const csvInputStream = new stream.Readable({ objectMode: true });
  csvInputStream._read = () => {}; // Must include, otherwise we get an error.

  const fileInputStream = fs.createReadStream(inputFilePath);
  papaparse.parse(fileInputStream, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,

    step: (results) => {
      //console.log("chunk input", results.data.length);
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
