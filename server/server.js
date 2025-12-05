import express from "express";
import { uvPath } from "uvod";
import { UVMiddleware } from "./uv.middleware.js";

const app = express();

// UV static files
app.use("/uv/", express.static(uvPath));

// UV middleware
app.use(UVMiddleware);

// Web UI
app.use(express.static("../web"));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("[SERVER] Running on", port));
