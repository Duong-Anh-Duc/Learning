// backend/controllers/course.controller.ts
import axios from "axios";
import cloudinary from "cloudinary";
import ejs from "ejs";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel, { ICourseData } from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import { io } from "../server"; // Import io để phát sự kiện
import { getAllCoursesService } from "../services/course.service";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const courseId = req.params.id;
      const courseData = await CourseModel.findById(courseId) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      // Cập nhật Redis
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);

      // Phát sự kiện courseUpdated đến tất cả người dùng
      io.to("allUsers").emit("courseUpdated", {
        message: `Khóa học ${course?.name} đã được cập nhật!`,
        course: {
          _id: course?._id,
          name: course?.name,
          thumbnail: course?.thumbnail,
          price: course?.price,
          estimatedPrice: course?.estimatedPrice,
        },
      });

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course --- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses --- without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content -- only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExists = userCourseList?.find(
        (course: any) => course.courseId.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const couseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!couseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add this question to our course content
      couseContent.questions.push(newQuestion);

      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${couseContent.title}`,
      });

      // save the updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const couseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!couseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = couseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // add this answer to our course content
      question.questionReplies.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        // create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${couseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: couseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;

      const courseId = req.params.id;
      const courseExists = userCourseList?.some(
        (course: any) => course.courseId.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });

      if (course) {
        course.ratings = avg / course.reviews.length;
      }

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days

      // create notification
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in review
interface IAddReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReplyData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses --- only for admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete Course --- only for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("course not found", 404));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Filter courses
export const filterCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        categories,
        level,
        minRating,
        minPurchased,
        sortOrder, // Thêm tham số sortOrder để sắp xếp theo giá
      } = req.query;

      // Tạo query lọc
      const query: any = {};

      // Tìm kiếm theo tên khóa học (không phân biệt hoa thường, hỗ trợ tìm kiếm gần đúng)
      if (name) {
        query.name = { $regex: name as string, $options: "i" };
      }

      // Lọc theo danh mục
      if (categories && categories !== "Tất cả") {
        query.categories = categories;
      }

      // Lọc theo cấp độ
      if (level && level !== "Tất cả") {
        query.level = level;
      }

      // Lọc theo mức đánh giá
      if (minRating) {
        query.ratings = { $gte: parseFloat(minRating as string) };
      }

      // Lọc theo độ phổ biến
      if (minPurchased) {
        query.purchased = { $gte: parseFloat(minPurchased as string) };
      }

      // Tạo query tìm kiếm
      let courseQuery = CourseModel.find(query).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      // Sắp xếp theo giá
      if (sortOrder) {
        if (sortOrder === "asc") {
          courseQuery = courseQuery.sort({ price: 1 }); // Tăng dần
        } else if (sortOrder === "desc") {
          courseQuery = courseQuery.sort({ price: -1 }); // Giảm dần
        }
      }

      // Thực hiện query
      const courses = await courseQuery;

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get categories
export const getCategories = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Lấy danh sách tất cả khóa học và trích xuất danh mục
      const courses = await CourseModel.find().select("categories");
      const categories = [...new Set(courses.map((course) => course.categories))].map(
        (category) => ({
          title: category,
        })
      );

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Create a new course (large course)
export const kienaddCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        categories,
        price,
        estimatedPrice,
        tags,
        level,
        benefits,
        prerequisites,
        courseData,
      } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!name || !description || !categories || !price || !tags || !level) {
        return next(new ErrorHandler("Vui lòng cung cấp đầy đủ các trường bắt buộc", 400));
      }

      // Xử lý thumbnail
      let thumbnail = {};
      if (req.files && (req.files as any).thumbnail) {
        const thumbnailFile = (req.files as any).thumbnail[0];
        const myCloud = await cloudinary.v2.uploader.upload(thumbnailFile.path, {
          folder: "courses/thumbnails",
          resource_type: "image",
        });
        thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
        fs.unlinkSync(thumbnailFile.path); // Xóa file tạm
      }

      // Xử lý demo video
      let demoUrl = req.body.demoUrl || "";
      if (req.files && (req.files as any).demoVideo) {
        const demoVideoFile = (req.files as any).demoVideo[0];
        const myCloud = await cloudinary.v2.uploader.upload(demoVideoFile.path, {
          folder: "courses/videos",
          resource_type: "video",
        });
        demoUrl = myCloud.secure_url;
        fs.unlinkSync(demoVideoFile.path); // Xóa file tạm
      }

      // Xử lý video trong courseData
      let parsedCourseData = courseData ? JSON.parse(courseData) : [];
      if (req.files && (req.files as any).courseVideos) {
        const courseVideoFiles = (req.files as any).courseVideos;
        for (let i = 0; i < courseVideoFiles.length && i < parsedCourseData.length; i++) {
          const myCloud = await cloudinary.v2.uploader.upload(courseVideoFiles[i].path, {
            folder: "courses/videos",
            resource_type: "video",
          });
          parsedCourseData[i].videoUrl = myCloud.secure_url;
          fs.unlinkSync(courseVideoFiles[i].path); // Xóa file tạm
        }
      }

      // Chuẩn bị dữ liệu khóa học
      const courseDataToSave = {
        name,
        description,
        categories,
        price,
        estimatedPrice: estimatedPrice || undefined,
        thumbnail,
        tags,
        level,
        demoUrl,
        benefits: benefits ? JSON.parse(benefits) : [],
        prerequisites: prerequisites ? JSON.parse(prerequisites) : [],
        courseData: parsedCourseData,
        ratings: 0,
        purchased: 0,
      };

      // Tạo khóa học mới
      const course = await CourseModel.create(courseDataToSave);

      // Lưu khóa học vào Redis
      await redis.set(course._id.toString(), JSON.stringify(course), "EX", 604800); // Lưu 7 ngày

      // Phát sự kiện newCourse đến tất cả người dùng
      io.to("allUsers").emit("newCourse", {
        message: `Khóa học mới: ${course.name} đã được thêm!`,
        course: {
          _id: course._id,
          name: course.name,
          thumbnail: course.thumbnail,
          price: course.price,
        },
      });

      res.status(201).json({
        success: true,
        message: "Khóa học được tạo thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Add a new lesson to a course (small lesson)
export const kienaddminiCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, title, description, videoSection, videoLength, videoPlayer, links, suggestion, questions } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!courseId || !title || !description || !videoSection || !videoLength || !videoPlayer) {
        return next(new ErrorHandler("Vui lòng cung cấp đầy đủ các trường bắt buộc cho bài học", 400));
      }

      // Tìm khóa học theo ID
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Không tìm thấy khóa học", 404));
      }

      // Xử lý video nếu có
      let videoUrl = "";
      if (req.files && (req.files as any).videoFile) {
        const videoFile = (req.files as any).videoFile[0];
        const myCloud = await cloudinary.v2.uploader.upload(videoFile.path, {
          folder: "courses/videos",
          resource_type: "video",
        });
        videoUrl = myCloud.secure_url;
        fs.unlinkSync(videoFile.path); // Xóa file tạm
      }

      // Xử lý ảnh thumbnail nếu có
      let videoThumbnail = {};
      if (req.files && (req.files as any).thumbnailFile) {
        const thumbnailFile = (req.files as any).thumbnailFile[0];
        const myCloud = await cloudinary.v2.uploader.upload(thumbnailFile.path, {
          folder: "courses/thumbnails",
          resource_type: "image",
        });
        videoThumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
        fs.unlinkSync(thumbnailFile.path); // Xóa file tạm
      }

      // Tạo courseData mới
      const newCourseData = {
        title,
        description,
        videoUrl,
        videoSection,
        videoLength: Number(videoLength),
        videoPlayer,
        links: links ? JSON.parse(links) : [],
        suggestion: suggestion || "",
        questions: questions ? JSON.parse(questions) : [],
        videoThumbnail,
      } as ICourseData; // Ép kiểu thành ICourseData

      // Thêm courseData vào mảng courseData của khóa học
      course.courseData.push(newCourseData);

      // Lưu lại khóa học
      await course.save();

      // Cập nhật Redis
      await redis.set(course._id.toString(), JSON.stringify(course), "EX", 604800); // Lưu 7 ngày

      res.status(200).json({
        success: true,
        message: "Đã thêm bài học nhỏ vào khóa học thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);