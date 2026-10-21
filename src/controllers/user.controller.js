import { matchedData } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { CourseModel } from "../models/course.model.js";

// Crear usuario con datos validados (matchedData)
export const createUser = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const newUser = await UserModel.create({
      name: validatedData.name,
      email: validatedData.email,
      age: validatedData.age,
      address: validatedData.address,
    });

    return res.status(201).json({
      msg: "Usuario creado correctamente",
      data: newUser,
    });
  } catch (error) {
    console.error("Error en createUser:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener todos los usuarios activos con populate de perfil y cursos
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ isDeleted: false })
      .populate("profile", "bio phone website github")
      .populate("courses", "title description price");

    return res.status(200).json({
      msg: "Usuarios obtenidos correctamente",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener un usuario por ID con populate
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findOne({ _id: id, isDeleted: false })
      .populate("profile", "bio phone website github")
      .populate("courses", "title description price");

    if (!user) {
      return res.status(404).json({
        msg: "Usuario no encontrado o dado de baja",
      });
    }

    return res.status(200).json({
      msg: "Usuario obtenido correctamente",
      data: user,
    });
  } catch (error) {
    console.error("Error en getUserById:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar usuario utilizando matchedData
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = matchedData(req, { locations: ["body"] });

    const user = await UserModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        msg: "Usuario no encontrado para actualizar",
      });
    }

    // Actualizar campos permitidos
    if (validatedData.name) user.name = validatedData.name;
    if (validatedData.email) user.email = validatedData.email;
    if (validatedData.age !== undefined) user.age = validatedData.age;
    if (validatedData.address) {
      user.address = {
        ...user.address.toObject(),
        ...validatedData.address,
      };
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      msg: "Usuario actualizado correctamente",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateUser:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminación lógica y en cascada de Usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        msg: "Usuario no encontrado o ya eliminado previamente",
      });
    }

    const deletionDate = new Date();

    // 1. Borrado lógico del usuario
    user.isDeleted = true;
    user.deletedAt = deletionDate;
    await user.save();

    // 2. Eliminación en cascada: Perfil asociado (1:1)
    const profileCascade = await ProfileModel.updateMany(
      { user: id, isDeleted: false },
      { isDeleted: true, deletedAt: deletionDate }
    );

    // 3. Eliminación en cascada: Cursos donde es instructor (1:N)
    const coursesCascade = await CourseModel.updateMany(
      { instructor: id, isDeleted: false },
      { isDeleted: true, deletedAt: deletionDate }
    );

    return res.status(200).json({
      msg: "Usuario eliminado lógicamente junto con sus dependencias en cascada",
      data: {
        userId: user._id,
        perfilEliminadoEnCascada: profileCascade.modifiedCount,
        cursosEliminadosEnCascada: coursesCascade.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};
