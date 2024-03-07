import mongoose from "mongoose";
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
});

export interface iopoolAccount extends mongoose.Document {
    user_id: mongoose.Schema.Types.ObjectId | String,
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
    }
}

export const IopoolAccountModel = mongoose.model<iopoolAccount>(
  "iopool_accounts",
  iopoolAccountScheme
);
