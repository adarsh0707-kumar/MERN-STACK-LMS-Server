import express from 'express'

import { authorizeRoles, isAutheticated } from '../middleware/auth'
import {
  createLayout,
  editLayout,
  getLayoutByType
} from '../controllers/layout.controllers'

const LayoutRouter = express.Router()

LayoutRouter.post(
  '/create-layout',
  isAutheticated,
  authorizeRoles('admin'),
  createLayout
)

LayoutRouter.put(
  '/edit-layout',
  isAutheticated,
  authorizeRoles('admin'),
  editLayout
)

LayoutRouter.get('/get-layout', getLayoutByType)

export default LayoutRouter
