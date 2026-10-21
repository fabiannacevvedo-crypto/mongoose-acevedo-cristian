import { body, param } from "express-validator";
import { ProfileModel } from "../models/profile.model.js";
import { UserModel } from "../models/user.model.js";
import { validateResult } from "./validator.middleware.js";

export const createProfileValidator = [
  // Validación de relación 1:1 con User
  body("user")
    .notEmpty()
    .withMessage("El ID de usuario es obligatorio")
    .isMongoId()
    .withMessage("El campo user debe ser un ObjectId válido")
    .custom(async (value) => {
      // Verificar que el usuario exista y no esté eliminado
      const user = await UserModel.findOne({ _id: value, isDeleted: false });
      if (!user) {
        throw new Error("El usuario especificado no existe o ha sido eliminado");
      }

      // Validar relación 1:1: Verificar que el usuario no tenga ya un perfil activo
      const existingProfile = await ProfileModel.findOne({
        user: value,
        isDeleted: false,
      });
      if (existingProfile) {
        throw new Error(
          "El usuario ya posee un perfil activo. La relación 1:1 solo permite un perfil por usuario."
        );
      }
      return true;
    }),

  body("bio")
    .trim()
    .notEmpty()
    .withMessage("La biografía es obligatoria")
    .isLength({ min: 5, max: 500 })
    .withMessage("La biografía debe tener entre 5 y 500 caracteres"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es obligatorio")
    .isLength({ min: 6, max: 30 })
    .withMessage("El teléfono debe tener entre 6 y 30 caracteres"),

  body("website")
    .optional()
    .trim()
    .isURL()
    .withMessage("El sitio web debe ser una URL válida"),

  body("github")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El usuario o link de GitHub no puede superar los 100 caracteres"),

  validateResult,
];

export const updateProfileValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro id debe ser un ObjectId válido"),

  body("bio")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("La biografía debe tener entre 5 y 500 caracteres"),

  body("phone")
    .optional()
    .trim()
    .isLength({ min: 6, max: 30 })
    .withMessage("El teléfono debe tener entre 6 y 30 caracteres"),

  body("website")
    .optional()
    .trim()
    .isURL()
    .withMessage("El sitio web debe ser una URL válida"),

  body("github")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El usuario o link de GitHub no puede superar los 100 caracteres"),

  validateResult,
];
