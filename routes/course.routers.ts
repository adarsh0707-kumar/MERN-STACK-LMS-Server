import express from 'express'
import { uploadCourse } from '../controllers/course.controllers'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
const courseRouter = express.Router()

courseRouter.post(
  '/creat-course',
  isAutheticated,
  authorizeRoles("admin"),
  uploadCourse
)

export default courseRouter