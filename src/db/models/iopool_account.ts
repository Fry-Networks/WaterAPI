import mongoose from "mongoose";

// Define a sub-document schema for measurement history
const measurementSchema = new mongoose.Schema({
  measurement: {
    temperature: Number,
    ph: Number,
    orp: Number,
    mode: String,
    isValid: Boolean,
    ecoId: String,
    measuredAt: String,
  },
  timestamp: { type: Date, default: Date.now }
});

export const iopoolAccountScheme = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  timestamp: Date,
  api_key: String,
  title: String,
  iopool_id: String,
  app_key: String,
  latestMeasure: {
    temperature: Number,
    ph: Number,
    orp: Number,
    mode: String,
    isValid: Boolean,
    ecoId: String,
    measuredAt: String,
  },
  measurementsHistory: [measurementSchema],
  metadata: {
    data_type: String,
},
});

export interface iopoolAccount extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId | String;
  timestamp: Date;
  api_key: String;
  api_type: String;
  title: String;
  iopool_id: String;
  app_key: String;
  latestMeasure: {
    temperature: Number;
    ph: Number;
    orp: Number;
    mode: String;
    isValid: Boolean;
    ecoId: String;
    measuredAt: String;
  };
  measurementsHistory: Array<{ measurement: any, timestamp: Date }>;
  metadata: {
    data_type: string;
  }
}

export const IopoolAccountModel = mongoose.model<iopoolAccount>(
  "iopool_accounts",
  iopoolAccountScheme
);
