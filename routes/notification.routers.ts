import express from 'express'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
import {
  getNotification,
  updateNotification
} from '../controllers/notification.controllers'

const notificationRouter = express.Router()

notificationRouter.get(
  '/get-all-notifications',
  isAutheticated,
  authorizeRoles('admin'),
  getNotification
)

notificationRouter.put(
  '/update-notifications/:id',
  isAutheticated,
  authorizeRoles('admin'),
  updateNotification
)

export default notificationRouter
