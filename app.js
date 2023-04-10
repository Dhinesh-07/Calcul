require("dotenv").config();
const express = require("express");
const request = require("request");

const app = express();

// Middleware for handling errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.get("/fare", (req, res, next) => {
  const { start, end } = req.query;
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  const startApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${start}.json?access_token=${accessToken}`;

  // Get start location coordinates from Mapbox API
  request(startApiUrl, (error, response, startBody) => {
    if (error) {
      return next(new Error("Unable to retrieve start location"));
    }

    const startCoords = JSON.parse(startBody).features[0]?.geometry?.coordinates;
    
    if (!startCoords) {
      return next(new Error("Unable to find start location"));
    }
    const endApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${end}.json?access_token=${accessToken}`;

    // Get end location coordinates from Mapbox API
    request(endApiUrl, (error, response, endBody) => {
      if (error) {
        return next(new Error("Unable to retrieve end location"));
      }

      const endCoords = JSON.parse(endBody).features[0]?.geometry?.coordinates;

      if (!endCoords) {
        return next(new Error("Unable to find end location"));
      }

      const distanceUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?access_token=${accessToken}&steps=false&geometries=geojson`;

      // Get distance between start and end locations from Mapbox API
      request(distanceUrl, (error, response, distanceBody) => {
        if (error) {
          return next(new Error("Unable to calculate distance"));
        }

        const distance = JSON.parse(distanceBody).routes[0]?.distance / 1000;

        if (!distance) {
          return next(new Error("Unable to calculate distance"));
        }

        const fare = distance * 3; // Fare is calculated based on distance

        res.json(`distance=${distance} km,fare=${fare} rupiah`);
      });
    });
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
