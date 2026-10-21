import { Router } from "express";
import {
  createProfile,
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
} from "../controllers/profile.controller.js";
import {
  createProfileValidator,
  updateProfileValidator,
} from "../middlewares/profile.validator.js";
import { paramIdValidator } from "../middlewares/validator.middleware.js";

export const profileRouter = Router();

profileRouter.post("/profiles", createProfileValidator, createProfile);
profileRouter.get("/profiles", getAllProfiles);
profileRouter.get("/profiles/:id", paramIdValidator, getProfileById);
profileRouter.put("/profiles/:id", updateProfileValidator, updateProfile);
profileRouter.delete("/profiles/:id", paramIdValidator, deleteProfile);
