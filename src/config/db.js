import mongoose from "mongoose";
import dns from "node:dns/promises";

export const connectDB = async () => {
  try {
    dns.setServers(["1.1.1.1", "1.0.0.1"]);

    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not defined in .env");

    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};