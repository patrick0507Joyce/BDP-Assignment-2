"use strict";

const stream = require('stream');

const openMongodbOutputStream = (dbCollection) => {
    const csvOutputStream = new stream.Writable({ objectMode: true });
    csvOutputStream._write = (chunk, encoding, callback) => {
        //console.log("chunk output", chunk.length);
        if(chunk.length !== 0) {
            dbCollection.insertMany(chunk)
                .then(() => {
                    callback();
                })
                .catch(err => {
                    callback(err);
                })
        } else {
            csvOutputStream.emit("finish");
        }
    }
    return csvOutputStream;
}

module.exports = openMongodbOutputStream;