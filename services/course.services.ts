import { Response } from 'express'
import CourseModel from '../models/course.models'
import { CatchAsyncError } from '../middleware/catchAsyncError'

// create course

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    const course = await CourseModel.create(data)
    res.status(201).json({
      success: true,
      course
    })
  }
)
// get all course

export const getAllCourseServices = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 })

  res.status(201).json({
    success: true,
    courses
  })
}
