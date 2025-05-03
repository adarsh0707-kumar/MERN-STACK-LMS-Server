import { Request, Response, NextFunction } from 'express'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import cloudinary from 'cloudinary'
import { createCourse } from '../services/course.services'
import CourseModel from '../models/course.models'

// upload course

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses'
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      }

      createCourse(data, res, next)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// edit course

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id)

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses'
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      }

      const courseId = req.params.id

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data
        },
        {
          new: true
        }
      )

      res.status(201).json({
        success: true,
        course
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)
