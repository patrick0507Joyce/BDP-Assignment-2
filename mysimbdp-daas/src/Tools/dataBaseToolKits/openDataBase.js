const MongoClient = require("mongodb").MongoClient;

const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const openDataBase = (dbName, collectionName) => {
    return MongoClient.connect(process.env.DB_CONNECT, dbConfig).then((client) => {
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      return {
        collection: collection,
        close: () => {
          return client.close();
        },
      };
    });
  };

module.exports = openDataBase;