import { Request, Response, NextFunction } from 'express'
import cloudinary from 'cloudinary'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import LayoutModel from '../models/layout.models'
import { title } from 'process'

// create layout

export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body

      const isTypeExist = await LayoutModel.findOne({ type })

      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exist`, 400))
      }

      if (type === 'Banner') {
        const { image, title, subTitle } = req.body

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout'
        })

        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          },
          title,
          subTitle
        }

        await LayoutModel.create(banner)
      }

      if (type === 'FAQ') {
        const { faq } = req.body
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer
            }
          })
        )
        await LayoutModel.create({ type: 'FAQ', faq: faqItems })
      }

      if (type === 'Categories') {
        const { categoties } = req.body

        const categotiesItems = await Promise.all(
          categoties.map(async (item: any) => {
            return {
              title: item.title
            }
          })
        )

        await LayoutModel.create({
          type: 'Categories',
          categoties: categotiesItems
        })
      }

      res.status(200).json({
        success: true,
        message: 'Layout created successfully...'
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)

// edit latout

export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body

      if (type === 'Banner') {
        const { image, title, subTitle } = req.body

        const bannerData: any = await LayoutModel.findOne({ type: 'Banner' })

        await cloudinary.v2.uploader.destroy(bannerData.image.public_id)

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout'
        })

        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          },
          title,
          subTitle
        }

        await LayoutModel.findByIdAndUpdate(bannerData._id, banner)
      }

      if (type === 'FAQ') {
        const { faq } = req.body

        const faqItem: any = await LayoutModel.findOne({ type: 'FAQ' })

        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer
            }
          })
        )
        await LayoutModel.findByIdAndUpdate(faqItem?._id, {
          type: 'FAQ',
          faq: faqItems
        })
      }

      if (type === 'Categories') {
        const { categoties } = req.body

        const categotiesItem: any = await LayoutModel.findOne({
          type: 'Categories'
        })

        const categotiesItems = await Promise.all(
          categoties.map(async (item: any) => {
            return {
              title: item.title
            }
          })
        )

        await LayoutModel.findByIdAndUpdate(categotiesItem._id, {
          type: 'Categories',
          categoties: categotiesItems
        })
      }

      res.status(200).json({
        success: true,
        message: 'Layout Updated successfully...'
      })
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500))
    }
  }
)
