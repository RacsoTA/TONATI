import express from "express";
import cors from "cors";

import config from "./config.js";

// Funciones de firebase
import bandejasRoute from "./routes/bandejas.route.js";
import procesosRoute from "./routes/procesos.route.js";
import parametrosRoute from "./routes/parametros.routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3002",
      "http://192.168.1.183:3002",
      "http://192.168.1.183:3001",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Rutas
app.use("", bandejasRoute);
app.use("", procesosRoute);
app.use("/parametros", parametrosRoute);

app.listen(config.port, () =>
  console.log(`Server is live @ ${config.hostUrl}`)
);
