import { body, param } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { validateResult } from "./validator.middleware.js";

export const createUserValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 60 })
    .withMessage("El nombre debe tener entre 2 y 60 caracteres"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe proporcionar un email válido")
    .custom(async (value) => {
      const user = await UserModel.findOne({
        email: value.toLowerCase(),
        isDeleted: false,
      });
      if (user) {
        throw new Error("El email ya se encuentra registrado por otro usuario");
      }
      return true;
    }),

  body("age")
    .notEmpty()
    .withMessage("La edad es obligatoria")
    .isInt({ min: 0, max: 120 })
    .withMessage("La edad debe ser un número entero entre 0 y 120"),

  // Validación de la propiedad embebida 'address'
  body("address")
    .notEmpty()
    .withMessage("La dirección embebida es obligatoria")
    .isObject()
    .withMessage("La dirección debe ser un objeto"),

  body("address.street")
    .trim()
    .notEmpty()
    .withMessage("La calle de la dirección es obligatoria")
    .isLength({ min: 2, max: 100 })
    .withMessage("La calle debe tener entre 2 y 100 caracteres"),

  body("address.city")
    .trim()
    .notEmpty()
    .withMessage("La ciudad de la dirección es obligatoria")
    .isLength({ min: 2, max: 50 })
    .withMessage("La ciudad debe tener entre 2 y 50 caracteres"),

  body("address.country")
    .trim()
    .notEmpty()
    .withMessage("El país de la dirección es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El país debe tener entre 2 y 50 caracteres"),

  body("address.postalCode")
    .trim()
    .notEmpty()
    .withMessage("El código postal de la dirección es obligatorio")
    .isLength({ min: 2, max: 20 })
    .withMessage("El código postal debe tener entre 2 y 20 caracteres"),

  validateResult,
];

export const updateUserValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro id debe ser un ObjectId válido"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("El nombre debe tener entre 2 y 60 caracteres"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Debe proporcionar un email válido")
    .custom(async (value, { req }) => {
      const user = await UserModel.findOne({
        email: value.toLowerCase(),
        _id: { $ne: req.params.id },
        isDeleted: false,
      });
      if (user) {
        throw new Error("El email ya se encuentra en uso por otro usuario");
      }
      return true;
    }),

  body("age")
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage("La edad debe ser un número entero entre 0 y 120"),

  body("address.street")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("La calle debe tener entre 2 y 100 caracteres"),

  body("address.city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("La ciudad debe tener entre 2 y 50 caracteres"),

  body("address.country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El país debe tener entre 2 y 50 caracteres"),

  body("address.postalCode")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("El código postal debe tener entre 2 y 20 caracteres"),

  validateResult,
];
