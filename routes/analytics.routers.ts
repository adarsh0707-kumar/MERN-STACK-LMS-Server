import express from 'express'

import { authorizeRoles, isAutheticated } from '../middleware/auth'
import {
  getCoursesAnalytics,
  getUserAnalytics
} from '../controllers/analytics.controllers'

const analyticsRouter = express.Router()

analyticsRouter.get(
  '/get-user-analytics',
  isAutheticated,
  authorizeRoles('admin'),
  getUserAnalytics
)

analyticsRouter.get(
  '/get-courses-analytics',
  isAutheticated,
  authorizeRoles('admin'),
  getCoursesAnalytics
)

export default analyticsRouter
