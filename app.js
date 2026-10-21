import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import { startDB } from "./src/config/database.js";
import { apiRouter } from "./src/routes/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Ruta base de prueba / bienvenida
app.get("/", (req, res) => {
  res.status(200).json({
    msg: "API REST con Express, Mongoose y MongoDB - Práctica Unidad 3",
    author: "Cristian Acevedo",
    endpoints: {
      users: "/api/users",
      profiles: "/api/profiles",
      courses: "/api/courses",
      tags: "/api/tags",
    },
  });
});

// Rutas de la API
app.use("/api", apiRouter);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    msg: "Recurso no encontrado",
    path: req.originalUrl,
  });
});

// Middleware global de manejo de errores (500)
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({
    msg: "Error interno del servidor",
    error: err.message,
  });
});

// Inicio del servidor
export const server = app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor escuchando correctamente en el puerto ${PORT}`);
  console.log(`URL local: http://localhost:${PORT}`);
});

export default app;
