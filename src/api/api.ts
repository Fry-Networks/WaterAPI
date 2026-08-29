import axios from "axios";
import bodyparser from "body-parser";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { IO_POOL_URL } from "../const.js";
import { connect } from "../db/connect.js";
import { IopoolAccountModel, MeasurementTimeSeriesModel } from "../db/models/iopool_account.js";
import { getUserByAddress } from "../db/models/users-schema.js";
import submitEcowitRoute from "./routes/submitEcowitt.js";

const app = express();
app.use(bodyparser.json());

// Create a rate limiter that tracks by the 'address' field in the request body
const limiter = rateLimit({
  // Use Redis to store rate limit data
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each address to 100 requests per windowMs
  keyGenerator: function (req) {
    // use 'address' field in body as key
    return req.body.address;
  },
  handler: function (req, res) {
    // response when rate limit exceeded
    console.log("Rate limit exceeded for " + req.body.address);
    res.status(429).send({
      message: "Too many requests, please try again later.",
      status: "ERROR",
    });
  },
});

app.use(limiter);
app.set("trust proxy", 1);
app.get("/", function (req, res) {
  res.status(403).send({
    message: "Please use the API as described in the documentation.",
  });
});
async function validateKey(apiKey: any): Promise<any> {
  console.log('in validate key')
  try {
    const headers = {
      "x-api-key": apiKey,
    };
   const response = await axios
      .get(IO_POOL_URL, { headers })
      return { success: true, response:response?.data?.[0] };
  } catch (error) {
    return { success: false, response: error };
  }
}
// Function to fetch and update data dynamically for all collections
async function fetchDataDynamically() {
  try {
    const documents = await IopoolAccountModel.find();

    for (const document of documents) {
      const apiKey = document.api_key;
      const { success, response } = await validateKey(apiKey);
      if (success) {
        const latestMeasureString = JSON.stringify(document.latestMeasure);
        const responseMeasureString = JSON.stringify(response.latestMeasure);
        if (latestMeasureString !== responseMeasureString) {
          // Save previous measurements to historical data collection
          await MeasurementTimeSeriesModel.create({
            temperature: document.latestMeasure.temperature,
            ph: document.latestMeasure.ph,
            orp: document.latestMeasure.orp,
            mode: document.latestMeasure.mode,
            isValid: document.latestMeasure.isValid,
            ecoId: document.latestMeasure.ecoId,
            measuredAt: document.latestMeasure.measuredAt,
            metadata: {
              data_type: "iopool",
              iopool_id: document.iopool_id,
            },
            timestamp: new Date(),
          });

          // Update latestMeasure in current data collection
          document.latestMeasure = response.latestMeasure;
          await document.save();
          console.log(`Updated document with API key: ${apiKey}`);
        } else {
          console.log(`No update needed for document with API key: ${apiKey}`);
        }
      } else {
        console.error(`Error validating API key: ${apiKey}`, response);
      }
    }
  } catch (error) {
    console.error("Error fetching or updating data:", error);
  }
}
// Start continuous data retrieval when the application starts
setInterval(fetchDataDynamically, 10 * 60 * 1000); // Run every 10 minutes

/**
 * API to get Key From Users
 */
app.post("/api/submitIopool", async function (req, res) {
  try {
    const apiKey = req.body.apiKey;
    const address = req.body.address;

    // Check if the API key already exists in the database
    const existingKey = await IopoolAccountModel.exists({ api_key: apiKey });

    if (existingKey) {
      return res.status(409).send({
        message: "This api key already exists in the database.",
        status: "ERROR",
      });
    }
    const { success, response } = await validateKey(apiKey);
    if (success) {
      const user = await getUserByAddress(address);
      const key = new IopoolAccountModel({
        user_id: user._id,
        timestamp: new Date(),
        api_type: "iopool",
        api_key: apiKey,
        title: response.title,
        latestMeasure: response.latestMeasure,
        iopool_id: response.id,
        metadata: {
          data_type: "iopool",
        }
      });
      await key.save();
      
      return res.status(200).send({
        message: "Successfully linked your App Key to your wallet address!\nWe will soon begin to retreive data from your Iopool devices.",
        status: "SUCCESS",
      });
    } else {
      // If the key is invalid, return an error
      return res.status(400).send({
        message: "Key is invalid. Please Enter Valid Api Key",
        status: "ERROR",
      });
    }
  } catch (error) {
    console.error("Error submitting IO Pool API key:", error);
    // Handle other errors
    return res.status(500).send({
      message: "Internal server error.",
      status: "ERROR",
    });
  }
});

app.use(submitEcowitRoute);

export async function startApi() {
  await connect();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}
