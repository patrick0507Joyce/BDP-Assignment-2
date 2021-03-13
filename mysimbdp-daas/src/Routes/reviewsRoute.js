const router = require("express").Router();
const openDataBase = require("../Tools/dataBaseToolKits/openDataBase");

const collectionName = "reviews";

router.post('/streamIngest', (request, response) => {
  console.log(request.body);
  openDataBase(process.env.DB_NAME, collectionName).then((db) => {
    db.collection
      .insertOne(request.body)
      .then(() => {
        db.close(); // Close database when done.
        response.send("success");
      });
  });
})

router.get('/filter/listingId/:listingId',async (request, response) => {
  let result = null;
  openDataBase(process.env.DB_NAME, collectionName).then((db) => {
    const query = {
      // Define our database query
      listing_id: Number(request.params.listingId)
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
})

module.exports = router;
