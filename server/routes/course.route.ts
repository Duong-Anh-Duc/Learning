// backend/routes/course.route.ts
import express from "express";
import multer from "multer";
import {
  addAnwser,
  addQuestion,
  addReplyToReview,
  addReview,
  createCourseReview,
  createLessonComment,
  deleteCourse,
  editCourse,
  filterCourses,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCategories,
  getCourseByUser,
  getCourseReviews,
  getLessonComments,
  getSingleCourse,
  kienaddCourse,
  kienaddminiCourse,
  replyCourseReview,
  replyLessonComment,
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
const courseRouter = express.Router();

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// API tạo khóa học lớn (thay thế /kientran)
courseRouter.post(
  "/create-course",
  //isAutheticated,
  //authorizeRoles("admin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Ảnh thumbnail
    { name: "demoVideo", maxCount: 1 }, // Video demo
    { name: "courseVideos", maxCount: 10 }, // Video trong courseData
  ]),
  kienaddCourse
);

// API thêm bài học nhỏ vào khóa học (thay thế /kientran2)
courseRouter.post(
  "/add-lesson",
  //isAutheticated,
  //authorizeRoles("admin"),
  upload.fields([
    { name: "videoFile", maxCount: 1 }, // Video chính của bài học
    { name: "thumbnailFile", maxCount: 1 }, // Ảnh thumbnail cho video
  ]),
  kienaddminiCourse
);

// Các API khác giữ nguyên
courseRouter.put(
  "/edit-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get(
  "/get-admin-courses",
  isAutheticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);

courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

courseRouter.put("/add-question", isAutheticated, addQuestion);

courseRouter.put("/add-answer", isAutheticated, addAnwser);

courseRouter.put("/add-review/:id", isAutheticated, addReview);

courseRouter.put(
  "/add-reply",
  isAutheticated,
  authorizeRoles("admin"),
  addReplyToReview
);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete(
  "/delete-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCourse
);

courseRouter.get("/get-categories", getCategories);
courseRouter.get("/filter-courses", filterCourses);

courseRouter.post("/courses/:courseId/reviews",  createCourseReview);

// Reply to course review
courseRouter.post("/courses/:courseId/reviews/:reviewId/reply",  replyCourseReview);

// Create lesson comment
courseRouter.post("/courses/:courseId/lessons/:lessonId/comments",  createLessonComment);

// Reply to lesson comment
courseRouter.post("/courses/:courseId/lessons/:lessonId/comments/:commentId/reply", replyLessonComment);

// Get all course reviews
courseRouter.get("/courses/:courseId/reviews", getCourseReviews);

// Get all lesson comments
courseRouter.get("/courses/:courseId/lessons/:lessonId/comments", getLessonComments);



export default courseRouter;