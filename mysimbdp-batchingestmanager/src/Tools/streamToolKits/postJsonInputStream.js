const axios = require("axios");
const stream = require("stream");

const postJsonInputStream = (fileName) => {
  if (!fileName) {
    return;
  }

  let serverAddress = process.env.SERVER_ADDRESS;

  let collectionName = process.env.COLLECTION_NAME;
  let clientId = process.env.CLIENT_ID;

  const csvOutputStream = new stream.Writable({ objectMode: true, highWaterMark:500 });
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

  csvOutputStream._writev = (chunks, callback) => {

    chunkCount++;
    //console.log({chunkCount});
    if (chunks.length !== 0) {
      axios
        .post(serverAddress, chunks, {
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

      if (chunkCount % 2000 == 0) {
        console.log(
          "fileName",
          fileName,
          "chunk length",
          chunks.length,
          "output stream:",
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
