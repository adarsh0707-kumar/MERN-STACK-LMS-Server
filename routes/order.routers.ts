import express from 'express'
import { authorizeRoles, isAutheticated } from '../middleware/auth'
import { createOrder, getAllOrder } from '../controllers/order.controllers'

const orderRouter = express.Router()

orderRouter.post('/create-order', isAutheticated, createOrder)

orderRouter.get(
  '/get-orders',
  isAutheticated,
  authorizeRoles('admin'),
  getAllOrder
)

export default orderRouter
