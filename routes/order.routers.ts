import express from 'express'
import { isAutheticated } from '../middleware/auth'
import { createOrder } from '../controllers/order.controllers'

const orderRouter = express.Router()

orderRouter.post('/create-order', isAutheticated, createOrder)

export default orderRouter
