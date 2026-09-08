import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import routes from "./routes";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", routes);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Logged Error Stack:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
