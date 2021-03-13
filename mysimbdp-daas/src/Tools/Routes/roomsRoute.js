const router = require("express").Router();
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");
const fileUploadMiddleware = require("../Middleware/fileUploadMiddleware");
const dataIngest = require("../Tools/dataBaseToolKits/dataIngest.js");

const collectionName = "rooms";

router.post("/batchIngest",fileUploadMiddleware.single(process.env.UPLOADED_CSV_KEY),
 (request, response) => {
  const collectionArr = ["reviews", "rooms", "hosts"];
    try {
      if (request.file == undefined) {
        return response.status(400).send("Please upload a CSV file!");
      }
      const dataPath = request.file.destination + request.file.filename;
      
      console.log({dataPath});
      let collectionName = request.body.collectionName;

      if (!collectionArr.includes(collectionName)) {
        return response.status(400).send("Please check your collectionName!");
      }

      dataIngest(dataPath, collectionName, (err) => {
        if (err) {
          console.log("error on the way", err);
          response.status(500).send({
            message:
              "upload the file failed on the way: " + request.file.originalname,
          });
        }
        response.status(200).json({
          "fileName:": request.file.originalname,
        });
      });
    } catch (error) {
      console.log(error);
      response.status(500).send({
        message: "Could not upload the file: " + request.file.originalname,
      });
    }
});

router.post("/streamIngest", (request, response) => {
  console.log(request.body);
  openDataBase(process.env.DB_NAME, collectionName).then((db) => {
    db.collection
      .insertOne(request.body)
      .then(() => {
        db.close(); // Close database when done.
        response.send("success");
      });
  });
});

router.get("/:id", async (request, response) => {
  let result = null;
  openDataBase(process.env.DB_NAME, collectionName).then((db) => {
    const query = {
      // Define our database query
      id: Number(request.params.id),
    };

    db.collection
      .find(query) // Retreive records with id
      .toArray()
      .then((data) => {
        console.log(data);
        result = data;
      })
      .then(() => {
        db.close(); // Close database when done.
        response.json(result);
      });
  });
});

router.get(
  "/filter/minimumNights/:minimumNights",
  async (request, response) => {
    let result = null;
    console.log(request.params.minimumNights);
    openDataBase(process.env.DB_NAME, collectionName).then((db) => {
      const query = {
        // Define our database query
        minimum_nights: { $gt: Number(request.params.minimumNights) },
      };

      db.collection
        .find(query) // Retreive records with id
        .toArray()
        .then((data) => {
          console.log(data.length);
          result = data;
        })
        .then(() => {
          db.close(); // Close database when done.
          response.json(result);
        });
    });
  }
);

module.exports = router;
