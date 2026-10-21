import { body, param } from "express-validator";
import { TagModel } from "../models/tag.model.js";
import { validateResult } from "./validator.middleware.js";

export const createTagValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la etiqueta es obligatorio")
    .isLength({ min: 2, max: 40 })
    .withMessage("El nombre debe tener entre 2 y 40 caracteres")
    .custom(async (value) => {
      const tag = await TagModel.findOne({
        name: new RegExp(`^${value}$`, "i"),
        isDeleted: false,
      });
      if (tag) {
        throw new Error("Ya existe una etiqueta activa con ese nombre");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("La descripción no puede superar los 300 caracteres"),

  validateResult,
];

export const updateTagValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro id debe ser un ObjectId válido"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("El nombre debe tener entre 2 y 40 caracteres")
    .custom(async (value, { req }) => {
      const tag = await TagModel.findOne({
        name: new RegExp(`^${value}$`, "i"),
        _id: { $ne: req.params.id },
        isDeleted: false,
      });
      if (tag) {
        throw new Error("Ya existe otra etiqueta activa con ese nombre");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("La descripción no puede superar los 300 caracteres"),

  validateResult,
];
