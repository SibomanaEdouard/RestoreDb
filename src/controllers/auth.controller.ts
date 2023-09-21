import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import IUserDocument from "../models/user.model";
import bcrypt from "bcryptjs";
import { sendEmailUsingSendPulse } from "../config/sendEmail";
import moment from "moment";
const secretKey = process.env.JWT_SECRET || "mysecretkey";

function createToken(userId: string): string {
  const payload = { userId };
  const token = jwt.sign(payload, secretKey, { expiresIn: "5d" });
  return token;
}

class UserController {
  public static async createUser(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const existingUser = await req.db
        .collection("users")
        .findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser: IUserDocument = await req.db
        .collection("users")
        .insertOne({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          role: "user",
          address: "",
          phone: "",
          verifyCodeToken: "",
          isEmailVerify: false,
          password: hashedPassword,
          createdAt: moment.utc().toISOString(),
          updatedAt: moment.utc().toISOString(),
          __v: 0,
        });
      const accessToken = createToken(newUser._id);
      return res.status(200).json({
        message: "User created successfully",
        user: newUser,
        accessToken: accessToken,
      });
    } catch (error) {
      return res.status(404).json({
        message: "User Duplicated!",
      });
    }
  }
  public static async loginUser(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    console.log(req.body);
    try {
      if (typeof req.body.email !== "string") {
        throw new Error("Invalid email address");
      }
      const user = await req.db
        .collection("users")
        .findOne({ email: req.body.email });
      ({ email: req.body.email as string });

      if (user === null) {
        return res.status(404).json({
          message: "User not found!",
        });
      }
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (isPasswordMatch) {
        const accessToken = createToken(user?._id);
        return res.status(200).json({ user: user, accessToken: accessToken });
      } else {
        return res.status(400).json({
          message: "Email or Password is not match!",
        });
      }
    } catch (error) {
      return res.status(404).json({
        message: "User not found!",
      });
    }
  }

  public static async loadUser(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const user = req.user as IUserDocument;
      const isUser = await req.db
        .collection("users")
        .findOne({ _id: user._id as string });
      const accessToken = createToken(user?._id);
      return res.status(200).json({ user: isUser, accessToken: accessToken });
    } catch (error) {
      return res.status(404).json({
        message: "User no longer available!",
      });
    }
  }
  public static async updateUser(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const user = req.user as IUserDocument;
      const isUser = await req.db.collection("users").findOne({
        _id: user._id as string,
      });
      if (isUser) {
        Object.assign(isUser, req.body);
        const updatedUser = await isUser.save();
        return res.status(200).json({ doc: updatedUser });
      } else {
        return res.status(404).json({
          message: "User no longer available!",
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: "User no longer available!",
      });
    }
  }
  public static async verifyEmail(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const user = await req.db.collection("users").findOne({
        email: req.query.email,
      });

      if (user) {
        const verifyCode = Math.floor(100000 + Math.random() * 900000);
        const token = jwt.sign(
          { userId: user._id, verificationCode: verifyCode },
          secretKey,
          {
            expiresIn: "10min",
          }
        );
        const templateId = "113dacd4daa21b23d8b21b8b7ee56287";
        user.verifyCodeToken = token;
        await user.save();

        await sendEmailUsingSendPulse(
          [{ name: user.firstName, email: user.email }],
          "Email Verification Code",
          verifyCode.toString(),
          templateId
        );
        return res.status(200).json({
          message: "Send Email!",
        });
      } else {
        return res.status(404).json({
          message: "User not found!",
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: "User no longer available!",
      });
    }
  }
  public static async verifyCode(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const verifyCode = req.body.verifyCode;
      const email = req.body.email;
      const isUser = (await req.db.collection("users").findOne({
        email: email,
      })) as IUserDocument;
      const decoded = jwt.verify(isUser.verifyCodeToken, secretKey);
      if (
        decoded.userId == isUser._id &&
        parseInt(verifyCode) === parseInt(decoded.verificationCode)
      ) {
        return res.status(200).json();
      } else {
        res.status(400).json({ message: "Verification code is not match!" });
      }
    } catch (error) {
      return res
        .status(404)
        .json({ message: "Time is out. Please request resend code." });
    }
  }
  public static async resetPassword(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    try {
      const user = await req.db.collection("users").findOne({
        email: req.body.email,
      });
      const encryptedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = req.body.password;
      await user.save();
      return res.status(200).json({ success: true });
    } catch (err) {
      return res
        .status(400)
        .send({ message: "Ungültige Anmeldeinformationen" });
    }
  }
}
export default UserController;
