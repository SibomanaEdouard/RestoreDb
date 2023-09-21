// import path from "path";
import express, { Application, Request, Response } from "express";
import authRoutes from "./auth.router";
import chartRoutes from "./chart.router";

export default function routes(app: Application): void {
  app.use("/api/auth", authRoutes);
  app.use("/api/chart", chartRoutes);

  //   app.get("/api/*", (req: Request, res: Response) => {
  //     res.status(404).json({
  //       message: "Not found",
  //     });
  //   });

  //   app.use(express.static(path.join(__dirname, "../client", "build")));

  app.get("/", (req: Request, res: Response) => {
    // res.sendFile(path.join(__dirname, "../client", "build", "index.html"));
    res.status(200).send("Hello world!");
  });
}
