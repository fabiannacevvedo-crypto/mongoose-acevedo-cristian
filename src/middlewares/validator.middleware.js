import { param, validationResult } from "express-validator";

// Middleware reutilizable para capturar y devolver errores de validación con código 400
export const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      msg: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

// Validador reutilizable para verificar que el parámetro :id sea un ObjectId válido
export const paramIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro id debe ser un ObjectId de MongoDB válido"),
  validateResult,
];
