import { matchedData } from "express-validator";
import { CourseModel } from "../models/course.model.js";

// Crear un curso (1:N con User instructor, N:M con Tag)
export const createCourse = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const newCourse = await CourseModel.create({
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      instructor: validatedData.instructor,
      tags: validatedData.tags || [],
    });

    const populatedCourse = await CourseModel.findById(newCourse._id)
      .populate("instructor", "name email")
      .populate("tags", "name description");

    return res.status(201).json({
      msg: "Curso creado exitosamente",
      data: populatedCourse,
    });
  } catch (error) {
    console.error("Error en createCourse:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener todos los cursos activos con populate de instructor y etiquetas
export const getAllCourses = async (req, res) => {
  try {
    const courses = await CourseModel.find({ isDeleted: false })
      .populate("instructor", "name email")
      .populate("tags", "name description");

    return res.status(200).json({
      msg: "Cursos obtenidos correctamente",
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error en getAllCourses:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener curso por ID con populate
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await CourseModel.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("instructor", "name email")
      .populate("tags", "name description");

    if (!course) {
      return res.status(404).json({
        msg: "Curso no encontrado o dado de baja",
      });
    }

    return res.status(200).json({
      msg: "Curso obtenido correctamente",
      data: course,
    });
  } catch (error) {
    console.error("Error en getCourseById:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar curso usando matchedData
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = matchedData(req, { locations: ["body"] });

    const course = await CourseModel.findOne({ _id: id, isDeleted: false });
    if (!course) {
      return res.status(404).json({
        msg: "Curso no encontrado para actualizar",
      });
    }

    if (validatedData.title) course.title = validatedData.title;
    if (validatedData.description) course.description = validatedData.description;
    if (validatedData.price !== undefined) course.price = validatedData.price;
    if (validatedData.instructor) course.instructor = validatedData.instructor;
    if (validatedData.tags) course.tags = validatedData.tags;

    await course.save();

    const updated = await CourseModel.findById(id)
      .populate("instructor", "name email")
      .populate("tags", "name description");

    return res.status(200).json({
      msg: "Curso actualizado correctamente",
      data: updated,
    });
  } catch (error) {
    console.error("Error en updateCourse:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Eliminación lógica de un curso
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await CourseModel.findOne({ _id: id, isDeleted: false });
    if (!course) {
      return res.status(404).json({
        msg: "Curso no encontrado o ya eliminado",
      });
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();

    return res.status(200).json({
      msg: "Curso eliminado lógicamente de forma correcta",
      data: {
        courseId: course._id,
      },
    });
  } catch (error) {
    console.error("Error en deleteCourse:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Endpoint específico: Agregar un nuevo vínculo en la relación N:M (Curso <-> Tag)
export const addTagToCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { tagId } = matchedData(req, { locations: ["body"] });

    // Agregar el ID de la etiqueta al arreglo tags evitando duplicados ($addToSet)
    const updatedCourse = await CourseModel.findByIdAndUpdate(
      id,
      { $addToSet: { tags: tagId } },
      { new: true }
    )
      .populate("instructor", "name email")
      .populate("tags", "name description");

    return res.status(200).json({
      msg: "Vínculo muchos a muchos (N:M) agregado exitosamente entre curso y etiqueta",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error en addTagToCourse:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Endpoint específico: Eliminar vínculo en la relación N:M (Curso <-> Tag)
export const removeTagFromCourse = async (req, res) => {
  try {
    const { id, tagId } = req.params;

    const course = await CourseModel.findOne({ _id: id, isDeleted: false });
    if (!course) {
      return res.status(404).json({
        msg: "Curso no encontrado o eliminado",
      });
    }

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      id,
      { $pull: { tags: tagId } },
      { new: true }
    )
      .populate("instructor", "name email")
      .populate("tags", "name description");

    return res.status(200).json({
      msg: "Vínculo N:M removido exitosamente",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error en removeTagFromCourse:", error);
    return res.status(500).json({
      msg: "Error interno del servidor",
      error: error.message,
    });
  }
};
