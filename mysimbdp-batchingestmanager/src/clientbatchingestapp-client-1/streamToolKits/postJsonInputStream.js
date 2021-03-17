const axios = require("axios");
const { emit } = require("process");
const stream = require("stream");

const postJsonInputStream = (fileName) => {
  if (!fileName) {
    return;
  }

  let serverAddress = process.env.SERVER_ADDRESS;

  let collectionName = process.env.COLLECTION_NAME;
  let clientId = process.env.CLIENT_ID;

  const csvOutputStream = new stream.Writable({
    objectMode: true,
    highWaterMark: 5
  });
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
  
  csvOutputStream.on('done', () => {
    console.log("json uploading DONE");
    const used = process.memoryUsage();
    for (let key in used) {
      console.log(`OUTPUT: ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
    uploadCompleted();
  })
  
  csvOutputStream._write = (chunk, encoding, callback) => {
    chunkCount++;
    if (chunk !== null && chunk.length > 0) {
      
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
        
    
      if (chunkCount % 100 === 0) {
        console.log(
          "fileName",
          fileName,
          "chunk length",
          chunk.length,
          "output stream:",
          chunkCount,
          "writable size:",
          csvOutputStream.writableLength
        );
      }
      return callback();
    } else {
      csvOutputStream.emit('done', 200);
    }
  };
  return csvOutputStream;
};

module.exports = postJsonInputStream;
