import { body, param } from "express-validator";
import { CourseModel } from "../models/course.model.js";
import { UserModel } from "../models/user.model.js";
import { TagModel } from "../models/tag.model.js";
import { validateResult } from "./validator.middleware.js";

export const createCourseValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El título del curso es obligatorio")
    .isLength({ min: 3, max: 120 })
    .withMessage("El título debe tener entre 3 y 120 caracteres")
    .custom(async (value) => {
      const course = await CourseModel.findOne({
        title: value,
        isDeleted: false,
      });
      if (course) {
        throw new Error("Ya existe un curso registrado con ese título");
      }
      return true;
    }),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 10, max: 1000 })
    .withMessage("La descripción debe tener entre 10 y 1000 caracteres"),

  body("price")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),

  // Relación 1:N: Validar que el instructor exista
  body("instructor")
    .notEmpty()
    .withMessage("El instructor es obligatorio")
    .isMongoId()
    .withMessage("El instructor debe ser un ObjectId válido")
    .custom(async (value) => {
      const instructor = await UserModel.findOne({
        _id: value,
        isDeleted: false,
      });
      if (!instructor) {
        throw new Error(
          "El instructor especificado no existe o ha sido eliminado"
        );
      }
      return true;
    }),

  // Relación N:M: Validar tags iniciales si se envían
  body("tags")
    .optional()
    .isArray()
    .withMessage("Las etiquetas deben ser enviadas como un arreglo"),

  body("tags.*")
    .optional()
    .isMongoId()
    .withMessage("Cada etiqueta debe ser un ObjectId válido")
    .custom(async (value) => {
      const tag = await TagModel.findOne({ _id: value, isDeleted: false });
      if (!tag) {
        throw new Error(
          `La etiqueta con ID ${value} no existe o ha sido eliminada`
        );
      }
      return true;
    }),

  validateResult,
];

export const updateCourseValidator = [
  param("id")
    .isMongoId()
    .withMessage("El parámetro id debe ser un ObjectId válido"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("El título debe tener entre 3 y 120 caracteres")
    .custom(async (value, { req }) => {
      const course = await CourseModel.findOne({
        title: value,
        _id: { $ne: req.params.id },
        isDeleted: false,
      });
      if (course) {
        throw new Error("Ya existe otro curso registrado con ese título");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("La descripción debe tener entre 10 y 1000 caracteres"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),

  body("instructor")
    .optional()
    .isMongoId()
    .withMessage("El instructor debe ser un ObjectId válido")
    .custom(async (value) => {
      const instructor = await UserModel.findOne({
        _id: value,
        isDeleted: false,
      });
      if (!instructor) {
        throw new Error(
          "El instructor especificado no existe o ha sido eliminado"
        );
      }
      return true;
    }),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Las etiquetas deben ser un arreglo"),

  body("tags.*")
    .optional()
    .isMongoId()
    .withMessage("Cada etiqueta debe ser un ObjectId válido"),

  validateResult,
];

// Validador obligatorio para endpoint N:M (agregar nuevo vínculo entre curso y etiqueta)
export const addTagToCourseValidator = [
  param("id")
    .isMongoId()
    .withMessage("El ID del curso debe ser un ObjectId válido")
    .custom(async (value) => {
      const course = await CourseModel.findOne({
        _id: value,
        isDeleted: false,
      });
      if (!course) {
        throw new Error("El curso no existe o ha sido eliminado");
      }
      return true;
    }),

  body("tagId")
    .notEmpty()
    .withMessage("El tagId es obligatorio")
    .isMongoId()
    .withMessage("El campo tagId debe ser un ObjectId válido")
    .custom(async (value, { req }) => {
      // 1. Validar que la etiqueta exista y no esté eliminada
      const tag = await TagModel.findOne({ _id: value, isDeleted: false });
      if (!tag) {
        throw new Error("La etiqueta no existe o ha sido eliminada");
      }

      // 2. Validar que el vínculo no esté duplicado
      const course = await CourseModel.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
      if (course && course.tags.some((t) => t.toString() === value)) {
        throw new Error("El vínculo entre el curso y la etiqueta ya existe");
      }

      return true;
    }),

  validateResult,
];

export const removeTagFromCourseValidator = [
  param("id")
    .isMongoId()
    .withMessage("El ID del curso debe ser un ObjectId válido"),
  param("tagId")
    .isMongoId()
    .withMessage("El ID de la etiqueta debe ser un ObjectId válido"),
  validateResult,
];
