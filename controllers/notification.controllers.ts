import { Response, Request, NextFunction } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import NotificationModel from '../models/notification.models'


// get all notification -- only for admin
export const getNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1
      })

      res.status(201).json({
        success: true,
        notifications
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)
