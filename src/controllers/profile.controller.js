import { matchedData } from "express-validator";
import { ProfileModel } from "../models/profile.model.js";
import { UserModel } from "../models/user.model.js";

// Crear perfil (Relación 1:1 con User)
export const createProfile = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const newProfile = await ProfileModel.create({
      user: validatedData.user,
      bio: validatedData.bio,
      phone: validatedData.phone,
      website: validatedData.website || "",
      github: validatedData.github || "",
    });

    // Actualizar referencia en el modelo User para relación bidireccional 1:1
    await UserModel.findByIdAndUpdate(validatedData.user, {
      profile: newProfile._id,
    });

    const populatedProfile = await ProfileModel.findById(newProfile._id).populate(
      "user",
      "name email"
    );

    return res.status(201).json({
      msg: "Perfil creado y vinculado al usuario correctamente",
      data: populatedProfile,
    });
  } catch (error) {
    console.error("Error en createProfile:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener todos los perfiles activos con populate de usuario
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await ProfileModel.find({ isDeleted: false }).populate(
      "user",
      "name email age"
    );

    return res.status(200).json({
      msg: "Perfiles obtenidos correctamente",
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error("Error en getAllProfiles:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener perfil por ID con populate
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await ProfileModel.findOne({
      _id: id,
      isDeleted: false,
    }).populate("user", "name email age");

    if (!profile) {
      return res.status(404).json({
        msg: "Perfil no encontrado o dado de baja",
      });
    }

    return res.status(200).json({
      msg: "Perfil obtenido correctamente",
      data: profile,
    });
  } catch (error) {
    console.error("Error en getProfileById:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar perfil usando matchedData
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = matchedData(req, { locations: ["body"] });

    const profile = await ProfileModel.findOne({ _id: id, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        msg: "Perfil no encontrado para actualizar",
      });
    }

    if (validatedData.bio !== undefined) profile.bio = validatedData.bio;
    if (validatedData.phone !== undefined) profile.phone = validatedData.phone;
    if (validatedData.website !== undefined) profile.website = validatedData.website;
    if (validatedData.github !== undefined) profile.github = validatedData.github;

    const updatedProfile = await profile.save();

    return res.status(200).json({
      msg: "Perfil actualizado correctamente",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminación lógica del perfil y desvinculación en cascada en User
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await ProfileModel.findOne({ _id: id, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        msg: "Perfil no encontrado o ya eliminado",
      });
    }

    profile.isDeleted = true;
    profile.deletedAt = new Date();
    await profile.save();

    // Desvincular del modelo de usuario
    await UserModel.updateOne({ profile: id }, { $unset: { profile: "" } });

    return res.status(200).json({
      msg: "Perfil eliminado lógicamente y desvinculado del usuario",
      data: {
        profileId: profile._id,
      },
    });
  } catch (error) {
    console.error("Error en deleteProfile:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};
