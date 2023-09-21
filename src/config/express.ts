import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const app = express();
// app.use(express.static(path.join(__dirname, "../../client", "build")));

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded());

export default app;
