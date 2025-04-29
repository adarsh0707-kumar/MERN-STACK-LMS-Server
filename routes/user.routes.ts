import express from "express";
import { registrationUser, activateUser, loginUser } from "../controllers/user.controllers";

const userRouter = express.Router();

userRouter.post('/registration', registrationUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login-user", loginUser);

export default userRouter;