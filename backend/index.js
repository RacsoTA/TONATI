import express from "express";
import cors from "cors";

import config from "./config.js";

// Funciones de firebase
import bandejasRoute from "./routes/bandejas.route.js";
import procesosRoute from "./routes/procesos.route.js";
import parametrosRoute from "./routes/parametros.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("", bandejasRoute);
app.use("", procesosRoute);
app.use("/parametros", parametrosRoute);

app.listen(config.port, () =>
  console.log(`Server is live @ ${config.hostUrl}`)
);
