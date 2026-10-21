import { matchedData } from "express-validator";
import { TagModel } from "../models/tag.model.js";
import { CourseModel } from "../models/course.model.js";

// Crear una etiqueta (Tag)
export const createTag = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const newTag = await TagModel.create({
      name: validatedData.name,
      description: validatedData.description || "",
    });

    return res.status(201).json({
      msg: "Etiqueta creada exitosamente",
      data: newTag,
    });
  } catch (error) {
    console.error("Error en createTag:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener todas las etiquetas activas
export const getAllTags = async (req, res) => {
  try {
    const tags = await TagModel.find({ isDeleted: false });

    return res.status(200).json({
      msg: "Etiquetas obtenidas correctamente",
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    console.error("Error en getAllTags:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener etiqueta por ID con populate virtual de cursos (Investigación: populate sin referencia directa)
export const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    // Aquí demostramos cómo poblar cursos desde Tag mediante Virtual Populate
    const tag = await TagModel.findOne({ _id: id, isDeleted: false }).populate(
      "courses",
      "title description price instructor"
    );

    if (!tag) {
      return res.status(404).json({
        msg: "Etiqueta no encontrada o dada de baja",
      });
    }

    return res.status(200).json({
      msg: "Etiqueta obtenida correctamente con sus cursos relacionados (Virtual Populate)",
      data: tag,
    });
  } catch (error) {
    console.error("Error en getTagById:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar etiqueta
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = matchedData(req, { locations: ["body"] });

    const tag = await TagModel.findOne({ _id: id, isDeleted: false });
    if (!tag) {
      return res.status(404).json({
        msg: "Etiqueta no encontrada para actualizar",
      });
    }

    if (validatedData.name) tag.name = validatedData.name;
    if (validatedData.description !== undefined) {
      tag.description = validatedData.description;
    }

    const updatedTag = await tag.save();

    return res.status(200).json({
      msg: "Etiqueta actualizada correctamente",
      data: updatedTag,
    });
  } catch (error) {
    console.error("Error en updateTag:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminación lógica de la etiqueta y eliminación en cascada de sus referencias en Course
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await TagModel.findOne({ _id: id, isDeleted: false });
    if (!tag) {
      return res.status(404).json({
        msg: "Etiqueta no encontrada o ya eliminada",
      });
    }

    tag.isDeleted = true;
    tag.deletedAt = new Date();
    await tag.save();

    // Cascada: Remover el ID de esta etiqueta de todos los cursos que la tengan asignada
    const cascadeResult = await CourseModel.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    return res.status(200).json({
      msg: "Etiqueta eliminada lógicamente y desvinculada en cascada de los cursos",
      data: {
        tagId: tag._id,
        cursosActualizadosEnCascada: cascadeResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error en deleteTag:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};
