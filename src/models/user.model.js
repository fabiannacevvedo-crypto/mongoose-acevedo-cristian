import { Schema, model } from "mongoose";

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    // Propiedad embebida
    address: {
      type: addressSchema,
      required: true,
    },
    // Relación 1:1 referenciada con Profile
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      default: null,
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

// Virtual para obtener los cursos dictados por este usuario (1:N inverso sin almacenar array)
userSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "instructor",
});

export const UserModel = model("User", userSchema);
