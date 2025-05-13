import axios from "axios";
import cloudinary from "cloudinary";
import ejs from "ejs";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import CourseModel, { ICourseData } from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import userModel from "../models/user.model";
import { io } from "../server";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

// Interface cho videoThumbnail
interface CloudinaryResource {
  public_id: string;
  url: string;
}

export const editCourseService = async (
  courseId: string,
  data: any,
  files: any
) => {
  const courseData = (await CourseModel.findById(courseId)) as any;
  if (!courseData) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  const thumbnail = files?.thumbnail;
  if (thumbnail) {
    await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
    const myCloud = await cloudinary.v2.uploader.upload(thumbnail[0].path, {
      folder: "courses/thumbnails",
      resource_type: "image",
    });
    data.thumbnail = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
    fs.unlinkSync(thumbnail[0].path);
  }

  const demoVideo = files?.demoVideo;
  if (demoVideo) {
    await cloudinary.v2.uploader.destroy(courseData.demoUrl, {
      resource_type: "video",
    });
    const myCloud = await cloudinary.v2.uploader.upload(demoVideo[0].path, {
      folder: "courses/videos",
      resource_type: "video",
    });
    data.demoUrl = myCloud.secure_url;
    fs.unlinkSync(demoVideo[0].path);
  }

  const course = await CourseModel.findByIdAndUpdate(
    courseId,
    { $set: data },
    { new: true }
  );

  if (!course) {
    throw new ErrorHandler("Không thể cập nhật khóa học", 500);
  }

  await redis.set(courseId, JSON.stringify(course), "EX", 604800);

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

  return course;
};

export const getSingleCourseService = async (courseId: string) => {
  const isCacheExist = await redis.get(courseId);
  if (isCacheExist) {
    return JSON.parse(isCacheExist);
  }

  const course = await CourseModel.findById(courseId).select(
    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
  );

  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  await redis.set(courseId, JSON.stringify(course), "EX", 604800);
  return course;
};

export const getAllCoursesService = async () => {
  const courses = await CourseModel.find().select(
    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
  );
  return courses;
};

export const getCourseByUserService = async (
  userCourses: any[],
  courseId: string
) => {
  const courseExists = userCourses?.find(
    (course: any) => course.courseId.toString() === courseId.toString()
  );

  if (!courseExists) {
    throw new ErrorHandler("Bạn không có quyền truy cập khóa học này", 404);
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  return course.courseData;
};

export const addQuestionService = async (
  user: any,
  questionData: { question: string; courseId: string; contentId: string }
) => {
  const { question, courseId, contentId } = questionData;

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    throw new ErrorHandler("ID nội dung không hợp lệ", 400);
  }

  const courseContent = course?.courseData?.find((item: any) =>
    item._id.equals(contentId)
  );

  if (!courseContent) {
    throw new ErrorHandler("ID nội dung không hợp lệ", 400);
  }

  const newQuestion: any = {
    user,
    question,
    questionReplies: [],
  };

  courseContent.questions.push(newQuestion);

  await NotificationModel.create({
    user: user?._id,
    title: "Câu hỏi mới đã được nhận",
    message: `Bạn có một câu hỏi mới trong ${courseContent.title}`,
  });

  await course.save();
  return course;
};

export const addAnswerService = async (
  user: any,
  answerData: {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
  }
) => {
  const { answer, courseId, contentId, questionId } = answerData;

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    throw new ErrorHandler("ID nội dung không hợp lệ", 400);
  }

  const courseContent = course?.courseData?.find((item: any) =>
    item._id.equals(contentId)
  );

  if (!courseContent) {
    throw new ErrorHandler("ID nội dung không hợp lệ", 400);
  }

  const question = courseContent?.questions?.find((item: any) =>
    item._id.equals(questionId)
  );

  if (!question) {
    throw new ErrorHandler("ID câu hỏi không hợp lệ", 400);
  }

  const newAnswer: any = {
    user,
    answer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  question.questionReplies.push(newAnswer);

  await course.save();

  if (user._id === question.user._id) {
    await NotificationModel.create({
      user: user._id,
      title: "Phản hồi câu hỏi mới đã được nhận",
      message: `Bạn có một phản hồi mới trong ${courseContent.title}`,
    });
  } else {
    const data = {
      name: question.user.name,
      title: courseContent.title,
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/question-reply.ejs"),
      data
    );

    await sendMail({
      email: question.user.email,
      subject: "Phản hồi câu hỏi",
      template: "question-reply.ejs",
      data,
    });
  }

  return course;
};

export const addReviewService = async (
  userCourses: any[],
  courseId: string,
  user: any,
  reviewData: { review: string; rating: number }
) => {
  const courseExists = userCourses?.some(
    (course: any) => course.courseId.toString() === courseId.toString()
  );

  if (!courseExists) {
    throw new ErrorHandler("Bạn không có quyền truy cập khóa học này", 404);
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  const { review, rating } = reviewData;

  const reviewDataObj: any = {
    user,
    rating,
    comment: review,
  };

  course.reviews.push(reviewDataObj);

  let avg = 0;
  course.reviews.forEach((rev: any) => {
    avg += rev.rating;
  });

  course.ratings = avg / course.reviews.length;

  await course.save();
  await redis.set(courseId, JSON.stringify(course), "EX", 604800);

  await NotificationModel.create({
    user: user._id,
    title: "Đánh giá mới đã được nhận",
    message: `${user.name} đã đưa ra một đánh giá trong ${course.name}`,
  });

  return course;
};

export const addReplyToReviewService = async (
  replyData: { comment: string; courseId: string; reviewId: string },
  user: any
) => {
  const { comment, courseId, reviewId } = replyData;

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  const review = course.reviews?.find(
    (rev: any) => rev._id.toString() === reviewId
  );

  if (!review) {
    throw new ErrorHandler("Đánh giá không tồn tại", 404);
  }

  const replyDataObj: any = {
    user,
    comment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!review.commentReplies) {
    review.commentReplies = [];
  }

  review.commentReplies.push(replyDataObj);

  await course.save();
  await redis.set(courseId, JSON.stringify(course), "EX", 604800);

  return course;
};

export const getAdminAllCoursesService = async () => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });
  return courses;
};

export const deleteCourseService = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  await course.deleteOne({ id: courseId });
  await redis.del(courseId);

  return { message: "Khóa học đã được xóa thành công" };
};

export const generateVideoUrlService = async (videoId: string) => {
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
  return response.data;
};

export const filterCoursesService = async (queryParams: any) => {
  const { name, categories, level, minRating, minPurchased, sortOrder } =
    queryParams;

  const query: any = {};

  if (name) {
    query.name = { $regex: name as string, $options: "i" };
  }

  if (categories && categories !== "Tất cả") {
    query.categories = categories;
  }

  if (level && level !== "Tất cả") {
    query.level = level;
  }

  if (minRating) {
    query.ratings = { $gte: parseFloat(minRating as string) };
  }

  if (minPurchased) {
    query.purchased = { $gte: parseFloat(minPurchased as string) };
  }

  let courseQuery = CourseModel.find(query).select(
    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
  );

  if (sortOrder) {
    if (sortOrder === "asc") {
      courseQuery = courseQuery.sort({ price: 1 });
    } else if (sortOrder === "desc") {
      courseQuery = courseQuery.sort({ price: -1 });
    }
  }

  const courses = await courseQuery;
  return courses;
};

export const getCategoriesService = async () => {
  const courses = await CourseModel.find().select("categories");
  const categories = [
    ...new Set(courses.map((course) => course.categories)),
  ].map((category) => ({
    title: category,
  }));
  return categories;
};

export const hideCourseService = async (
  courseId: string,
  isHidden: boolean
) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  course.isHidden = isHidden;
  await course.save();
  await redis.set(courseId, JSON.stringify(course), "EX", 604800);

  return course;
};

export const hideLessonService = async (
  courseId: string,
  contentId: string,
  isHidden: boolean
) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  const lessonIndex = course.courseData.findIndex(
    (item: any) => item._id.toString() === contentId
  );
  if (lessonIndex === -1) {
    throw new ErrorHandler("Không tìm thấy bài học", 404);
  }

  course.courseData[lessonIndex].isHidden = isHidden;
  await course.save();
  await redis.set(courseId, JSON.stringify(course), "EX", 604800);

  return course;
};

export const getEnrolledUsersService = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
  }

  const users = await userModel
    .find({
      "courses.courseId": courseId,
    })
    .select("name email courses");

  return users.map((user) => {
    const courseEntry = user.courses.find(
      (c: any) => c.courseId.toString() === courseId
    );
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      enrollmentDate: courseEntry?.enrollmentDate || new Date(),
    };
  });
};
