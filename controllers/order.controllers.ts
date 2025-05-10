import { NextFunction, Request, Response } from 'express'
import path from 'path'
import ejs, { name } from 'ejs'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { IOrder } from '../models/order.models'
import userModel from '../models/user.models'
import CourseModel from '../models/course.models'
import { newOrder } from '../services/order.services'
import sendMail from '../utils/sendMail'
import NotificationModel from '../models/notification.models'

// create order

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder

      const user = await userModel.findById(req.user?._id)

      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      )

      if (courseExistInUser) {
        return next(
          new ErrorHandler('You have already purchased this course', 400)
        )
      }

      const course = await CourseModel.findById(courseId)

      if (!course) {
        return next(new ErrorHandler('Course not found', 404))
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id
      }

      newOrder(data, res, next)

      const mailData = {
        order: {
          _id: course._id.slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      }

      const html = await ejs.renderFile(
        path.join(__dirname, '../mail/order-confirmation.ejs'),
        { order: mailData }
      )

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: 'Order Confirmation',
            template: 'order-confirmation.ejs',
            data: mailData
          })
        }
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 500))
      }

      user?.courses.push(course?._id)

      await user?.save()

      await NotificationModel.create({
        user: user?._id,
        title: 'New Order',
        message: `You have a new order from ${course?.name}`
      })

      res.status(200).json({
        success: true,
        order: course
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)
