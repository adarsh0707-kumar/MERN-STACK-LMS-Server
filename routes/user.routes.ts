import express from 'express'
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/user.controllers'
import { isAutheticated, authorizeRoles } from '../middleware/auth'

const userRouter = express.Router()

userRouter.post('/registration', registrationUser)

userRouter.post('/activate-user', activateUser)

userRouter.post('/login', loginUser)

userRouter.get('/logout', isAutheticated, logoutUser)

userRouter.get('/refresh', updateAccessToken)

userRouter.get('/me', isAutheticated, getUserInfo)

userRouter.post('/social-auth', socialAuth)

userRouter.put('/update-user-info', isAutheticated, updateUserInfo)

userRouter.put('/update-user-password', isAutheticated, updatePassword)

userRouter.put('/update-user-avatar', isAutheticated, updateProfilePicture)

userRouter.get(
  '/get-users',
  isAutheticated,
  authorizeRoles('admin'),
  getAllUsers
)

userRouter.put(
  '/update-user',
  isAutheticated,
  authorizeRoles('admin'),
  updateUserRole
)

userRouter.delete(
  '/delete-user/:id',
  isAutheticated,
  authorizeRoles('admin'),
  deleteUser
)


export default userRouter
