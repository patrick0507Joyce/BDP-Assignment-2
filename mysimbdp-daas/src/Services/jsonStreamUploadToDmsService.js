const JSONStream = require("JSONStream");
const openMongodbOutputStream = require("../Tools/streamToolKits/openMongodbOutputStream");
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");
const glob = require("glob");

const jsonStreamUploadToDmsService = (query, callback) => {
  const fileDirPath = process.env.TMP_DIR_PATH + request.query.fileName;

  const fileName =
    process.env.TMP_DIR_PATH +
    request.query.fileName +
    "/" +
    request.query.fileName +
    ".json";
  openDataBase(process.env.DB_NAME, request.query.collectionName)
    .then((client) => {
      const outputDBConfig = {
        dbURL: process.env.DB_CONNECT,
        collection: "xiaohu",
      };
      const writableStream = streamToMongoDB(outputDBConfig);
      let count = 0;
      setInterval(() => {
        console.log("count:", count++);
        const used = process.memoryUsage();
        for (let key in used) {
          console.log(
            `OUTPUT: ${key} ${
              Math.round((used[key] / 1024 / 1024) * 100) / 100
            } MB`
          );
        }
      }, 5000);

      glob(fileDirPath + "/*.json", (err, files) => {
        const mongoOutputStream = openMongodbOutputStream(client.collection);

        files.map((fileName) => {
          fs.createReadStream(fileName)
            .pipe(JSONStream.parse("*"))
            .pipe(writableStream);
        });
      });

      writableStream.on("finish", () => {
        console.log("complete upload on: ", +request.query.fileName);
        return request.query.fileName;
      });
    })
    .catch((err) => {
      console.log("error info", err);
      throw err;
    });
};

module.exports = jsonStreamUploadToDmsService;
