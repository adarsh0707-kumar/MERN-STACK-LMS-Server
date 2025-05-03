import express from 'express'
import { editCourse, uploadCourse } from '../controllers/course.controllers'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
const courseRouter = express.Router()

courseRouter.post(
  '/creat-course',
  isAutheticated,
  authorizeRoles("admin"),
  uploadCourse
)

courseRouter.put(
  '/edit-course/:id',
  isAutheticated,
  authorizeRoles('admin'),
  editCourse
)


export default courseRouter