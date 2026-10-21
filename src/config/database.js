import mongoose from "mongoose";

export const startDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/practica-mongoose";
    await mongoose.connect(mongoUri);
    console.log("Conectado a MongoDB exitosamente");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    process.exit(1);
  }
};
