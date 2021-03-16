const fs = require("fs-extra");
const { ensureDir, ensureFile, ensureFileSync } = require("fs-extra");

const jsonChunkUploadHandle = (fileName, chunkCount, chunkContent) => {
  const dirPath = process.env.TMP_DIR_PATH + fileName + "/";

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  let chunkCountNum = Math.round(parseInt(chunkCount, 10) / 50 + 1);
  const fileNameUnique = fileName + "-" + ".json";
  const filePath = dirPath + fileNameUnique;
  fs.ensureDir(dirPath)
    .then(() => fs.ensureFile(filePath))
    .then(() => {
      const stream = fs.createWriteStream(filePath, {flags:'a'});
      stream.write(chunkContent,() => {
        stream.close();
      }) 
      /*
      fs.writeFile(filePath, chunkContent, (err) => {
        if (err) {
          console.log(err);
          return;
        }
      });
      */
    })
    .catch((err) => {
      console.error(err);
    });

  
    
    
};

module.exports = jsonChunkUploadHandle;
