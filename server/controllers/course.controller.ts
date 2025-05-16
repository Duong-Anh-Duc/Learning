import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  addAnswerService,
  addLessonToCourseService,
  addQuestionService,
  addReplyToReviewService,
  addReviewService,
  createCourseService,
  deleteCourseService,
  editCourseService,
  editLessonService,
  filterCoursesService,
  generateVideoUrlService,
  getAdminAllCoursesService,
  getAllCoursesService,
  getCategoriesService,
  getCourseByUserService,
  getEnrolledUsersService,
  getSingleCourseService,
  hideCourseService,
  hideLessonService,
} from "../services/course.service";
import ErrorHandler from "../utils/ErrorHandler";

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;
      const course = await editCourseService(courseId, data, req.files);

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const course = await getSingleCourseService(courseId);

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await getAllCoursesService();

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses as any;
      const courseId = req.params.id;
      const content = await getCourseByUserService(userCourseList, courseId);

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body;
      const course = await addQuestionService(req.user, { question, courseId, contentId });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } = req.body;
      const course = await addAnswerService(req.user, { answer, courseId, contentId, questionId });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses as any;
      const courseId = req.params.id;
      const { review, rating } = req.body;
      const course = await addReviewService(userCourseList, courseId, req.user, { review, rating });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body;
      const course = await addReplyToReviewService({ comment, courseId, reviewId }, req.user);

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAdminAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await getAdminAllCoursesService();

      res.status(201).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await deleteCourseService(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const data = await generateVideoUrlService(videoId);

      res.json(data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const filterCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await filterCoursesService(req.query);

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCategories = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await getCategoriesService();

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const createCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await createCourseService(req.body, req.files);

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

export const addLessonToCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await addLessonToCourseService(req.body, req.files);

      res.status(200).json({
        success: true,
        message: "Đã thêm bài học vào khóa học thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const editLesson = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await editLessonService(req.body, req.files);

      res.status(200).json({
        success: true,
        message: "Đã cập nhật bài học thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const hideCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const { isHidden } = req.body;
      const course = await hideCourseService(courseId, isHidden);

      res.status(200).json({
        success: true,
        message: isHidden ? "Ẩn khóa học thành công" : "Hiện khóa học thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const hideLesson = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const { contentId, isHidden } = req.body;
      const course = await hideLessonService(courseId, contentId, isHidden);

      res.status(200).json({
        success: true,
        message: isHidden ? "Ẩn bài học thành công" : "Hiện bài học thành công",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getEnrolledUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const users = await getEnrolledUsersService(courseId);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);