import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addTagToCourse,
  removeTagFromCourse,
} from "../controllers/course.controller.js";
import {
  createCourseValidator,
  updateCourseValidator,
  addTagToCourseValidator,
  removeTagFromCourseValidator,
} from "../middlewares/course.validator.js";
import { paramIdValidator } from "../middlewares/validator.middleware.js";

export const courseRouter = Router();

// CRUD general de cursos
courseRouter.post("/courses", createCourseValidator, createCourse);
courseRouter.get("/courses", getAllCourses);
courseRouter.get("/courses/:id", paramIdValidator, getCourseById);
courseRouter.put("/courses/:id", updateCourseValidator, updateCourse);
courseRouter.delete("/courses/:id", paramIdValidator, deleteCourse);

// Endpoints de vinculación en relación Muchos a Muchos (N:M)
courseRouter.post(
  "/courses/:id/tags",
  addTagToCourseValidator,
  addTagToCourse
);
courseRouter.delete(
  "/courses/:id/tags/:tagId",
  removeTagFromCourseValidator,
  removeTagFromCourse
);
