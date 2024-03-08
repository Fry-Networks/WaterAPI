import "dotenv/config";
import { startApi } from "./api.js";

const startApp = async () => {
  startApi();
};

startApp();
