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

  const slicedFileName = fileName.slice(0, -4);

  const uploadCompleted = () => {
    console.log("complete upload");
    axios
      .post(
        process.env.SERVER_ADDRESS_COMPLETE,
        {},
        {
          params: {
            collectionName: collectionName,
            clientId: clientId,
            fileName: slicedFileName,
            chunkCount: chunkCount,
          },
        }
      )
      .then((res) => {
        //fs.unlinkSync(dataPath);
        
      })
      .catch((error) => {
        //console.error(error);
      });
  };

  csvOutputStream._write = (chunk, encoding, callback) => {

    chunkCount++;
    if (chunk.length !== 0) {
      axios
        .post(serverAddress, chunk, {
          params: {
            collectionName: collectionName,
            clientId: clientId,
            fileName: slicedFileName,
            chunkCount: chunkCount,
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
        console.log(
          "fileName",
          fileName,
          "output stream:",
          chunk.length,
          " chunk count: ",
          chunkCount
        );
      }
      callback();
    } else {
      uploadCompleted();
      csvOutputStream.emit("finish");
    }
  };
  return csvOutputStream;
};

module.exports = postJsonInputStream;
