// require('dotenv').config();
import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
export const app = express()
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { ErrorMiddlewere } from './middleware/error'
import userRouter from './routes/user.routes'
import courseRouter from './routes/course.routers'
import orderRouter from './routes/order.routers'
import notificationRouter from './routes/notification.routers'

// body parser

app.use(express.json({ limit: '50mb' }))

// cookieParser

app.use(cookieParser())

// cors == cross origin resourse sharing

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Incoming request origin:', origin)
      callback(null, true)
    }
  })
)
// routes

app.use('/api/v1', userRouter, courseRouter, orderRouter, notificationRouter)

// testing api
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'API is working'
  })
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

app.use(ErrorMiddlewere)
