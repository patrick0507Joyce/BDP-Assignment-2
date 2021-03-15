const openDataBase = require("./openDataBase");

const chunkIngest = (chunk, chunkCount, collectionName,) => {
  openDataBase(process.env.DB_NAME, collectionName)
    .then((client) => {
        client.collection
        .insertMany(chunk, { ordered: false })
    })
    .then(() => {
        if (chunkCount % 200 === 0) {
            console.log(`store ${chunkCount} db successfully`);
        }
    })
    .catch((err) => {
      console.log("error info", err);
    });
};

module.exports = chunkIngest;
