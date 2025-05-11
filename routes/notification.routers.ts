import express from 'express'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
import { getNotification } from '../controllers/notification.controllers'

const notificationRouter = express.Router()

notificationRouter.get(
  '/get-all-notifications',
  isAutheticated,
  authorizeRoles('admin'),
  getNotification
)

export default notificationRouter