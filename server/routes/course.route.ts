import express from "express";
import {
  addAnwser,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  filterCourses,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCategories,
  getCourseByUser,
  getSingleCourse,
  kienaddCourse,
  kienaddminiCourse,
  uploadCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import multer from "multer";
const courseRouter = express.Router();

//kien viet api mơi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
courseRouter.post(
  "/kientran",
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // Ảnh thumbnail
    { name: "demoVideo", maxCount: 1 }, // Video demo
    { name: "courseVideos", maxCount: 10 }, // Video trong courseData
  ]),
  kienaddCourse
);

courseRouter.post(
  "/kientran2",
  upload.single("videoFile"), // Chỉ cần upload 1 video cho courseData
  kienaddminiCourse
);

//

courseRouter.post(
  "/create-course",
  isAutheticated,
  authorizeRoles("admin"),
  uploadCourse
);

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
export default courseRouter;
