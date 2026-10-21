import { Schema, model } from "mongoose";

const tagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
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

// Virtual populate para consultar cursos relacionados sin tener el campo de referencia en Tag
tagSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "tags",
  match: { isDeleted: false },
});

export const TagModel = model("Tag", tagSchema);
