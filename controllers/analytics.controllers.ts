import { Request, Response, NextFunction } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { generateLast12MonthData } from '../utils/analytics.generator'
import userModel from '../models/user.models'

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
