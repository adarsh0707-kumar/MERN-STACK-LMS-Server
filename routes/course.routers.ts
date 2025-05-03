import express from 'express'
import {
  addAnswer,
  addQuestion,
  editCourse,
  getAllCourse,
  getCourseByUser,
  getSingleCourse,
  uploadCourse
} from '../controllers/course.controllers'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
const courseRouter = express.Router()

courseRouter.post(
  '/creat-course',
  isAutheticated,
  authorizeRoles('admin'),
  uploadCourse
)

courseRouter.put(
  '/edit-course/:id',
  isAutheticated,
  authorizeRoles('admin'),
  editCourse
)

courseRouter.get('/get-course/:id', getSingleCourse)

courseRouter.get('/get-courses', getAllCourse)

courseRouter.get('/get-course-content/:id', isAutheticated, getCourseByUser)

courseRouter.put('/add-question', isAutheticated, addQuestion)

courseRouter.put('/add-answer', isAutheticated, addAnswer)

export default courseRouter
