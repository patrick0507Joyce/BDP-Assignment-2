const fs = require("fs-extra");
const { ensureDir, ensureFile, ensureFileSync } = require("fs-extra");

const jsonChunkUploadHandle = (fileName, chunkCount, chunkContent) => {
  const dirPath = "./tmp-client-stage-directory/" + fileName + "/";

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  let chunkCountNum = chunkCount;
  const fileNameUnique = chunkCountNum + fileName + uniqueSuffix + ".json";
  const filePath = dirPath + fileNameUnique;
  fs.ensureDir(dirPath)
    .then(() => fs.ensureFile(filePath))
    .then(() => {
      fs.writeFile(filePath, chunkContent, (err) => {
        if (err) {
          console.log(err);
          return;
        }
      });
    })
    .catch((err) => {
      console.error(err);
    });

  /*
    const stream = fs.createWriteStream(filePath);
    stream.once('open', fd => {
        stream.write(chunkContent);
        stream.end();
    })
    */
};

module.exports = jsonChunkUploadHandle;
