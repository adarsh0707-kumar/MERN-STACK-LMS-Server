import { Request, Response, NextFunction } from 'express'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import cloudinary from 'cloudinary'
import { createCourse } from '../services/course.services'
import CourseModel from '../models/course.models'
import { redis } from '../utils/redis'
import mongoose from 'mongoose'
import path from 'path'
import sendMail from '../utils/sendMail'
import ejs from 'ejs'

// upload course

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses'
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      }

      createCourse(data, res, next)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// edit course

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id)

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses'
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        }
      }

      const courseId = req.params.id

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data
        },
        {
          new: true
        }
      )

      res.status(201).json({
        success: true,
        course
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// get single course --- without purchasing

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id

      const isCacheExist = await redis.get(courseId)

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist)

        res.status(200).json({
          success: true,
          course
        })
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
        )

        await redis.set(courseId, JSON.stringify(course))

        res.status(200).json({
          success: true,
          course
        })
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// get All course --- without purchasing

export const getAllCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get('allCourses')

      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist)

        res.status(200).json({
          success: true,
          courses
        })
      } else {
        const courses = await CourseModel.find().select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
        )

        await redis.set('allCourses', JSON.stringify(courses))

        res.status(200).json({
          success: true,
          courses
        })
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// get course content --- only for valid user

export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id

      const courseExist = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      )

      if (!courseExist) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 400)
        )
      }

      const course = await CourseModel.findById(courseId)

      const content = course?.courseData

      res.status(200).json({
        success: true,
        content
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// add question course

interface IAddQuestionData {
  question: string
  courseId: string
  contentId: string
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body
      const course = await CourseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      )

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      // creat a new question object

      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: []
      }

      // add this question to our course content

      courseContent.questions.push(newQuestion)

      // save the new course

      await course?.save()

      res.status(200).json({
        success: true,
        course
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// add answer in course question

interface IAddAnswerData {
  answer: string
  courseId: string
  contentId: string
  questionId: string
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body
      const course = await CourseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      )

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      )

      if (!question) {
        return next(new ErrorHandler('Invalid question id', 400))
      }

      // creat a new answer object

      const newAnswer: any = {
        user: req.user,
        answer
      }

      // add this answer to our course content

      question.questionReplies.push(newAnswer)

      // save the new course

      await course?.save()

      if (req.user?._id === question.user._id) {
        // create a notification
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title
        }
        const html = await ejs.renderFile(
          path.join(__dirname, '../mail/question-reply.ejs'),
          data
        )

        try {
          const mail = await sendMail({
            email: question.user.email,
            subject: 'Question Replay',
            template: 'question-reply.ejs',
            data
          })
          console.log(mail)
        } catch (err: any) {
          return next(new ErrorHandler(err.message, 500))
        }
      }

      res.status(200).json({
        success: true,
        course
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// add review in course

interface IAddReviewData {
  review: string
  courseId: string
  rating: number
  userId: string
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses

      const courseId = req.params.id

      // check if courseId already exist in userCourseList based on _id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      )

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404)
        )
      }

      const course = await CourseModel.findById(courseId)

      const { review, rating } = req.body as IAddReviewData

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating
      }

      course?.review.push(reviewData)

      let avg = 0
      course?.review.forEach((rev: any) => {
        avg += rev.rating
      })

      if (course) {
        course.rating = avg / course.review.length
      }

      await course?.save()

      const notification = {
        title: ' New Review Received',
        message: `${req.user?.name} has given a review in ${course?.name}`
      }
      // create notification

      res.status(200).json({
        success: true,
        review
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)
