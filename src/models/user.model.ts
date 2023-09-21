// import { Document, model, Schema } from "mongoose";
// import bcrypt from "bcrypt";
export default interface IUserDocument extends Document {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  address?: string;
  phone?: string;
  verifyCodeToken?: string;
  isEmailVerify?: boolean;
}

// const UserSchema = new Schema<IUserDocument>(
//   {
//     firstName: { type: String, required: true, default: "" },
//     lastName: { type: String, required: true, default: "" },
//     email: { type: String, required: true, unique: true, index: true },
//     password: { type: String, required: true },
//     role: { type: String, default: "user" },
//     address: { type: String, default: "" },
//     phone: { type: String, default: "" },
//     verifyCodeToken: { type: String, default: "" },
//     isEmailVerify: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// UserSchema.pre<IUserDocument>("save", async function (next) {
//   if (!this.isModified("password")) {
//     return next();
//   }

//   try {
//     const salt = await bcrypt.genSalt(8);
//     const hashedPassword = await bcrypt.hash(this.password, salt);
//     this.password = hashedPassword;
//     next();
//   } catch (error) {
//     return next(error as any);
//   }
// });

// const User = model<IUserDocument>("User", UserSchema);
// User.createIndexes();
// export default User;
