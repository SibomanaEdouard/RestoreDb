import { connect, ConnectOptions } from "mongoose";

export async function connectDB(): Promise<void> {
  const options: ConnectOptions = {
    autoIndex: false,
    // serverSelectionTimeoutMS: 5000,
    // socketTimeoutMS: 45000,
    // family: 4,
  };

  try {
    await connect(process.env.MONGODB_URI as string, options);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
}
