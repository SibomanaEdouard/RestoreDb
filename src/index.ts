import app from "./config/express";
import { MongoClient, Db, MongoClientOptions } from "mongodb";
import express, { Request, Response, NextFunction } from "express";
// import { connectDB } from "./config/mongoose";

import routes from "./routes/routes";
import path from "path";
const PORT: number = parseInt(process.env.PORT as string, 10);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  console.log(process.env.MONGODB_URI);

  // app.get("*", (req, res) => {
  //   // res.sendFile(path.join(__dirname, "../client", "build", "index.html"));
  // });
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  MongoClient.connect(uri, { useUnifiedTopology: true } as any)
    .then((client: MongoClient) => {
      console.log("Connected to MongoDB");

      const db: Db = client.db(process.env.DBNAME);
      app.use((req: Request, res: Response, next: NextFunction) => {
        req.db = db;
        next();
      });

      // Sign-up route

      // Start the server
      routes(app);
    })
    .catch((err: any) => {
      console.error("Error connecting to MongoDB:", err);
    });
});
