import "dotenv/config";
import express, { Request, Response } from "express";
import routes from "./routes";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", routes);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
