require("dotenv").config();
const express = require("express");
const request = require("request");

const app = express();

app.get("/fare", (req, res) => {
  const { start, end } = req.query;
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${start}.json?access_token=${accessToken}`;

  // Get start location coordinates from Mapbox API
  request(apiUrl, (error, response, body) => {
    if (error) {
      res.status(500).json({ error: "Unable to retrieve start location" });
    }

    const startCoords = JSON.parse(body).features[0].geometry.coordinates;
    const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${end}.json?access_token=${accessToken}`;

    // Get end location coordinates from Mapbox API
    request(apiUrl, (error, response, body) => {
      if (error) {
        res.status(500).json({ error: "Unable to retrieve end location" });
      }

      const endCoords = JSON.parse(body).features[0].geometry.coordinates;
      const distanceUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?access_token=${accessToken}&steps=false&geometries=geojson`;

      // Get distance between start and end locations from Mapbox API
      request(distanceUrl, (error, response, body) => {
        if (error) {
          res.status(500).json({ error: "Unable to calculate distance" });
        }

        const distance = JSON.parse(body).routes[0].distance / 1000;
        console.log({ distance });
        const fare = distance * 3; // Fare is calculated based on distance

        res.json({ fare });
      });
    });
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
