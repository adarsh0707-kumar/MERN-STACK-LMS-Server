import { Response, Request, NextFunction } from 'express'
import cron from 'node-cron'

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

// update notification status --- only admin

export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id)

      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404))
      } else {
        notification?.status
          ? (notification.status = 'read')
          : notification?.status
      }

      await notification.save()

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

// delete notification only admin

cron.schedule('0 0 0 * * *', async () => {
  const thirtyDayAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await NotificationModel.deleteMany({
    status: 'read',
    createdAt: { $lt: thirtyDayAgo }
  })
  console.log("Deleted read notifications...")
})
