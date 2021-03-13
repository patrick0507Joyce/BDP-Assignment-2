const express = require("express");
const app = express();
//middleware
app.use(express.json());

//for loop of local files
const fs = require('fs')
const path = require('path')

//send file to daas
const clientFileToMysimbdpDaas = require('./Tools/clientFileToMysimbdpDaas.js')

const postClientFileToDaas = () => {
    fs.readdir(process.env.DATA_DIRECTORY, (err, files) => {
        console.log("Filenames with the .csv extension:");
        if (files) {
            files.forEach(file => { 
                if (path.extname(file) == ".csv") {
                    clientFileToMysimbdpDaas(file);
                }
            })
        }
    });
}

const checkStagedDirectory = () => {
    setInterval(postClientFileToDaas, 50000000);
};

checkStagedDirectory();

app.get('/', (request, response) => {
  response.send("connected!");
})

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
