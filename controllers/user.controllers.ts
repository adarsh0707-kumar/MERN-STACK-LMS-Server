import { Request, Response, NextFunction } from 'express'
import userModel, { IUser } from '../models/user.models'
import ErrorHandler from '../utils/ErrorHandler'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
require('dotenv').config()
import ejs from 'ejs'
import path from 'path'
import sendMail from '../utils/sendMail'
// import { resolveTypeReferenceDirective } from "typescript";addQuestion

import {
  getAllUsersServices,
  getUserById,
  updateUserRoleService
} from '../services/user.services'
import {
  sendToken,
  accessTokenOptions,
  refreshTokenOptions
} from '../utils/jwt'

import { redis } from '../utils/redis'
import cloudinary from 'cloudinary'

// resistor user

interface IRegistrationBody {
  name: string
  email: string
  password: string
  avatar?: string
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body
      const isEmailExist = await userModel.findOne({ email })
      if (isEmailExist) {
        return next(new ErrorHandler('Email already exist', 400))
      }

      const user: IRegistrationBody = {
        name,
        email,
        password
      }
      const activationToken = createActivationToken(user)

      const activationCode = activationToken.activationCode

      const data = { user: { name: user.name }, activationCode }

      const html = await ejs.renderFile(
        path.join(__dirname, '../mail/activation-mail.ejs'),
        data
      )

      try {
        await sendMail({
          email: user.email,
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data
        })

        res.status(201).json({
          success: true,
          messsge: `Check your email ${user.email} to activate your account!`,
          activationToken: activationToken.token
        })
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 400))
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

interface IActivationToken {
  token: string
  activationCode: string
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString()
  const token = jwt.sign(
    {
      user,
      activationCode
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m'
    }
  )

  return { token, activationCode }
}

// activation user

interface IActivationRequest {
  activation_token: string
  activation_code: string
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string }

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400))
      }

      const { name, email, password } = newUser.user

      const existUser = await userModel.findOne({ email })

      if (existUser) {
        return next(new ErrorHandler('User already exist', 400))
      }

      const user = await userModel.create({
        name,
        email,
        password
      })

      res.status(200).json({
        success: true
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// Login user

interface ILoginRequest {
  email: string
  password: string
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest

      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400))
      }

      const user = await userModel.findOne({ email }).select('+password')

      if (!user) {
        return next(new ErrorHandler('Invalid email...', 400))
      }

      const isPasswordMatch = await user.comparePassword(password)

      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid password...', 400))
      }

      sendToken(user, 200, res)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// logout user

export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 })
      res.cookie('refresh_token', '', { maxAge: 1 })

      const userId = req.user?._id || ''
      redis.del(userId)

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// update token access

export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload

      const message = 'Could not refresh token'
      if (!decoded) {
        return next(new ErrorHandler(message, 400))
      }

      const session = await redis.get(decoded.id as string)

      if (!session) {
        return next(new ErrorHandler("Please login for access this resources", 400))
      }

      const user = JSON.parse(session)

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: '5m'
        }
      )

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: '3d'
        }
      )

      req.user = user

      res.cookie('access_token', accessToken, accessTokenOptions)
      res.cookie('refresh_token', refreshToken, refreshTokenOptions)

      await redis.set(user._id, JSON.stringify(user), 'EX', 604800) // 7 days

      res.status(200).json({
        status: 'success',
        accessToken
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// get user info

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id
      getUserById(userId, res)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// social auth

interface ISocialAuthBody {
  email: string
  name: string
  avatar: string
}

export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody
      const user = await userModel.findOne({ email })

      if (!user) {
        const newUser = await userModel.create({ email, name, avatar })
        sendToken(newUser, 200, res)
      } else {
        sendToken(newUser, 200, res)
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// update user info

interface IUpdateUserInfo {
  name?: string
  email?: string
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Request, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo
      const userId = req.user?._id
      const user = await userModel.findById(userId)

      if (email && user) {
        const isEmailExist = await userModel.findOne({ email })
        if (isEmailExist) {
          return next(new ErrorHandler('Email already exist', 400))
        }
        user.email = email
      }

      if (name && user) {
        user.name = name
      }

      await user?.save()

      await redis.set(userId, JSON.stringify(user))

      res.status(201).json({
        success: true,
        user
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// update user password
interface IUpdatePassword {
  oldPassword: string
  newPassword: string
}

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Please enter old and new password', 400))
      }

      const user = await userModel.findById(req.user?._id).select('+password')

      if (user?.password === undefined) {
        return next(new ErrorHandler('Invalid user', 400))
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword)

      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid old Password', 400))
      }

      user.password = newPassword

      await user.save()

      await redis.set(req.user?._id, JSON.stringify(user))

      res.status(201).json({
        success: true,
        user
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// update profile pic

interface IupdateProfilePicture {
  avatar: string
}

export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const avatar = req.body

      const userId = req.user?._id

      const user = await userModel.findById(userId)

      if (avatar && user) {
        // if user have one avatar then call this if
        if (user?.avatar?.public_id) {
          // first delete the old pic

          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)

          // then uplode the new pic

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
            height: 150
          })

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          }
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
            height: 150
          })

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          }
        }
      }

      await user?.save()

      await redis.set(userId, JSON.stringify(user))

      res.status(200).json({
        success: true,
        user
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// get all users -- only for admin

export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersServices(res)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// update user role ---- only for admin

export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body
      updateUserRoleService(res, id, role)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)

// Delete user --- only for admin

export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const user = await userModel.findById(id)

      if (!user) {
        return next(new ErrorHandler('User not Found', 404))
      }

      await user.deleteOne({ id })

      await redis.del(id)

      res.status(200).json({
        success: true,
        message: 'User deleted successfully...'
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400))
    }
  }
)
