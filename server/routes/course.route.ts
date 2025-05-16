import express from "express";
import multer from "multer";
import {
  addAnwser,
  addLessonToCourse,
  addQuestion,
  addReplyToReview,
  addReview,
  createCourse,
  deleteCourse,
  editCourse,
  editLesson,
  filterCourses,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCategories,
  getCourseByUser,
  getEnrolledUsers,
  getSingleCourse,
  hideCourse,
  hideLesson,
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";

const courseRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage,
  limits  : {
    fileSize : 50 * 1024 * 1024,
  }
 });

courseRouter.post(
  "/create-course",
  isAutheticated,
  authorizeRoles("admin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideo", maxCount: 1 },
    { name: "courseVideos", maxCount: 10 },
  ]),
  createCourse
);

courseRouter.post(
  "/add-lesson",
  isAutheticated,
  authorizeRoles("admin"),
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  addLessonToCourse
);

courseRouter.put(
  "/edit-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideo", maxCount: 1 },
  ]),
  editCourse
);

courseRouter.put(
  "/edit-lesson",
  isAutheticated,
  authorizeRoles("admin"),
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  editLesson
);

courseRouter.put("/hide-course/:id", isAutheticated, authorizeRoles("admin"), hideCourse);

courseRouter.put("/hide-lesson/:id", isAutheticated, authorizeRoles("admin"), hideLesson);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get("/get-admin-courses", isAutheticated, authorizeRoles("admin"), getAdminAllCourses);

courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

courseRouter.put("/add-question", isAutheticated, addQuestion);

courseRouter.put("/add-answer", isAutheticated, addAnwser);

courseRouter.put("/add-review/:id", isAutheticated, addReview);

courseRouter.put("/add-reply", isAutheticated, authorizeRoles("admin"), addReplyToReview);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete("/delete-course/:id", isAutheticated, authorizeRoles("admin"), deleteCourse);

courseRouter.get("/get-categories", getCategories);

courseRouter.get("/filter-courses", filterCourses);

courseRouter.get("/enrolled-users/:id", isAutheticated, authorizeRoles("admin"), getEnrolledUsers);

export default courseRouter;