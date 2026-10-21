import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import {
  createUserValidator,
  updateUserValidator,
} from "../middlewares/user.validator.js";
import { paramIdValidator } from "../middlewares/validator.middleware.js";

export const userRouter = Router();

userRouter.post("/users", createUserValidator, createUser);
userRouter.get("/users", getAllUsers);
userRouter.get("/users/:id", paramIdValidator, getUserById);
userRouter.put("/users/:id", updateUserValidator, updateUser);
userRouter.delete("/users/:id", paramIdValidator, deleteUser);
