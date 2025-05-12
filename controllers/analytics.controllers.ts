import { Request, Response, NextFunction } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { generateLast12MonthData } from '../utils/analytics.generator'
import userModel from '../models/user.models'
import CourseModel from '../models/course.models'
import OrderModel from '../models/order.models'

// get users analytics --- only for admin

export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthData(userModel)

      res.status(200).json({
        success: true,
        users
      })



    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)


// get courses analytics --- only for admin

export const getCoursesAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthData(CourseModel)

      res.status(200).json({
        success: true,
        courses
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)


// get Order analytics --- only for admin

export const getOrdersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthData(OrderModel)

      res.status(200).json({
        success: true,
        orders
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

