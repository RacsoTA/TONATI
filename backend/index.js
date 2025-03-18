import express from "express";
import cors from "cors";

import config from "./config.js";

// Funciones de firebase
import bandejasRoute from "./routes/bandejas.route.js";
import procesosRoute from "./routes/procesos.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", bandejasRoute);
app.use("/api", procesosRoute);

app.listen(config.port, () =>
  console.log(`Server is live @ ${config.hostUrl}`)
);
