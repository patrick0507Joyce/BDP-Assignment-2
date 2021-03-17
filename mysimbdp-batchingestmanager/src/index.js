const express = require("express");
const app = express();
//middleware
app.use(express.json());

//built in file processing
const fs = require("fs");
const path = require("path");

//file change watcher
const chokidar = require("chokidar");

//send file to daas
const clientbatchingestapp = require("./clientbatchingestapp-client-1/clientbatchingestapp.js");

const watcher = chokidar.watch(process.env.DATA_DIRECTORY, {
  ignored: /^\./,
  persistent: true,
});

watcher.on("add", async (filePath) => {
  console.log("File", filePath, "has been added");
  //get pure file name
  const fileIndex = filePath.lastIndexOf("/") + 1;
  const filePureName = filePath.substring(fileIndex, filePath.length);

  if (path.extname(filePath) == ".csv") {
    try {
      let result = await clientbatchingestapp(filePureName);
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  }
});

app.get("/", (request, response) => {
  response.send("connected!");
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
