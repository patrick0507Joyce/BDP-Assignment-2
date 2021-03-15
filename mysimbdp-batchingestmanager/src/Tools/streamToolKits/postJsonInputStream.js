const axios = require("axios");
const stream = require("stream");

const postJsonInputStream = (fileName) => {
  if (!fileName) {
    return;
  }

  let serverAddress = process.env.SERVER_ADDRESS;

  let collectionName = process.env.COLLECTION_NAME;
  let clientId = process.env.CLIENT_ID;

  const csvOutputStream = new stream.Writable({ objectMode: true });
  let chunkCount = 0;
  csvOutputStream._write = (chunk, encoding, callback) => {
    //console.log("chunk output", chunk.length);

    chunkCount++;
    if (chunk.length !== 0) {
      //console.log(chunk.length);
      axios
        .post(serverAddress, chunk, {
          params: {
            collectionName: collectionName,
            clientId: clientId,
            fileName: fileName.slice(0, -4),
            chunkCount: chunkCount
          },
          headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
          //fs.unlinkSync(dataPath);
          console.log(`statusCode: ${res.status}`);
        })
        .catch((error) => {
          //console.error(error);
        });

      if (chunkCount % 200 == 0) {
        console.log("fileName", fileName, "output stream:",chunk.length, " chunk count: ", chunkCount);
      }
      callback();
    } else {
      csvOutputStream.emit("finish");
    }
  };
  return csvOutputStream;
};

module.exports = postJsonInputStream;
