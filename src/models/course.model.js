import { Schema, model } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Relación 1:N (Un instructor tiene muchos cursos; el curso referencia a 1 instructor)
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Relación N:M (Un curso tiene muchos tags; los tags pertenecen a muchos cursos)
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    // Borrado lógico
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const CourseModel = model("Course", courseSchema);
