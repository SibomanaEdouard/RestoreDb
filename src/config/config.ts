import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

interface Config {
  PORT: number;
  MONGODB_URI: string;
  // Add more environment variables as needed
}

const config: Config = {
  PORT: parseInt(process.env.PORT as string) || 80,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/mydb",
  // Add default values as needed
};

export default config;
