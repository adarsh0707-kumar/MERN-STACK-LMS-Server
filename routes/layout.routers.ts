import express from 'express'

import { authorizeRoles, isAutheticated } from '../middleware/auth'
import { createLayout } from '../controllers/layout.controllers'

const LayoutRouter = express.Router()

LayoutRouter.post(
  '/create-layout',
  isAutheticated,
  authorizeRoles('admin'),
  createLayout
)


export default LayoutRouter