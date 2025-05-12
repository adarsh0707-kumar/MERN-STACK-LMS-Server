import express from 'express'

import { authorizeRoles, isAutheticated } from '../middleware/auth'
import { createLayout, editLayout } from '../controllers/layout.controllers'

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

export default LayoutRouter
