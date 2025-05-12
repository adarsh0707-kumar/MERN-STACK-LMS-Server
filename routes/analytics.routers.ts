import express from 'express'

import { authorizeRoles, isAutheticated } from '../middleware/auth'
import { getUserAnalytics } from '../controllers/analytics.controllers'

const analyticsRouter = express.Router()

analyticsRouter.get(
  '/get-user-analytics',
  isAutheticated,
  authorizeRoles('admin'),
  getUserAnalytics
)

export default analyticsRouter