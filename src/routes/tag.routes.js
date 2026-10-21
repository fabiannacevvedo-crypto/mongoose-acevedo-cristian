import { Router } from "express";
import {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller.js";
import {
  createTagValidator,
  updateTagValidator,
} from "../middlewares/tag.validator.js";
import { paramIdValidator } from "../middlewares/validator.middleware.js";

export const tagRouter = Router();

tagRouter.post("/tags", createTagValidator, createTag);
tagRouter.get("/tags", getAllTags);
tagRouter.get("/tags/:id", paramIdValidator, getTagById);
tagRouter.put("/tags/:id", updateTagValidator, updateTag);
tagRouter.delete("/tags/:id", paramIdValidator, deleteTag);
