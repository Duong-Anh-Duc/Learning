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

// backend/services/course.service.ts
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

  // Tìm tất cả học viên đã đăng ký khóa học này
  const enrolledUsers = await userModel.find({ "courses.courseId": courseId });
  await Promise.all(
    enrolledUsers.map(async (user) => {
      await NotificationModel.create({
        userId: user._id.toString(),
        title: "Khóa Học Được Cập Nhật",
        message: `Khóa học "${course?.name}" đã được cập nhật!`,
        status: "unread",
      });

      io.to(user._id.toString()).emit("courseUpdated", {
        message: `Khóa học "${course?.name}" đã được cập nhật!`,
        course: {
          _id: course?._id,
          name: course?.name,
          thumbnail: course?.thumbnail,
          price: course?.price,
          estimatedPrice: course?.estimatedPrice,
        },
      });
    })
  );

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

  // Gửi thông báo qua socket.io cho học viên đã đặt câu hỏi
  io.to(question.user._id.toString()).emit("newQuestionReply", {
    message: `Bạn có phản hồi mới cho câu hỏi trong bài học "${courseContent.title}" của khóa học "${course.name}"!`,
    courseId,
    contentId,
    questionId,
  });

  // Gửi thông báo qua socket.io cho quản trị viên (nếu người trả lời không phải admin)
  if (user.role !== "admin") {
    const admins = await userModel.find({ role: "admin" });
    admins.forEach((admin) => {
      io.to(admin._id.toString()).emit("newQuestionReply", {
        message: `Câu hỏi trong bài học "${courseContent.title}" của khóa học "${course.name}" đã được trả lời bởi ${user.name}!`,
        courseId,
        contentId,
        questionId,
      });
    });
  }

  if (user._id === question.user._id) {
    await NotificationModel.create({
      userId: user._id.toString(),
      title: "Phản Hồi Câu Hỏi Mới",
      message: `Bạn có một phản hồi mới trong ${courseContent.title}`,
      status: "unread",
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
export const createCourseService = async (data: any, files: any) => {
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
  } = data;

  if (!name || !description || !categories || !price || !tags || !level) {
    throw new ErrorHandler("Vui lòng cung cấp đầy đủ các trường bắt buộc", 400);
  }
  console.log(data);
  console.log(files);
  let thumbnail: CloudinaryResource = { public_id: "", url: "" };
  if (files && files.thumbnail) {
    const thumbnailFile = files.thumbnail[0];
    const myCloud = await cloudinary.v2.uploader.upload(thumbnailFile.path, {
      folder: "courses/thumbnails",
      resource_type: "image",
    });
    thumbnail = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
    //fs.unlinkSync(thumbnailFile.path);
  }

  let demoUrl = data.demoUrl || "";
  if (files && files.demoVideo) {
    const demoVideoFile = files.demoVideo[0];
    const myCloud = await cloudinary.v2.uploader.upload(demoVideoFile.path, {
      folder: "courses/videos",
      resource_type: "video",
    });
    demoUrl = myCloud.secure_url;
    //fs.unlinkSync(demoVideoFile.path);
  }

  // let parsedCourseData = courseData ? JSON.parse(courseData) : [];
  // if (files && files.courseVideos) {
  //   const courseVideoFiles = files.courseVideos;
  //   for (
  //     let i = 0;
  //     i < courseVideoFiles.length && i < parsedCourseData.length;
  //     i++
  //   ) {
  //     const myCloud = await cloudinary.v2.uploader.upload(
  //       courseVideoFiles[i].path,
  //       {
  //         folder: "courses/videos",
  //         resource_type: "video",
  //       }
  //     );
  //     parsedCourseData[i].videoUrl = myCloud.secure_url;
  //     fs.unlinkSync(courseVideoFiles[i].path);
  //   }
  // }

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
    //courseData: parsedCourseData,
    ratings: 0,
    purchased: 0,
  };

  const course = await CourseModel.create(courseDataToSave);

  await redis.set(course._id.toString(), JSON.stringify(course), "EX", 604800);

  // Lưu thông báo cho tất cả người dùng
  const users = await userModel.find();
  await Promise.all(
    users.map(async (user) => {
      await NotificationModel.create({
        userId: user._id.toString(),
        title: "Khóa Học Mới",
        message: `Khóa học mới: ${course.name} vừa được thêm! Khám phá ngay.`,
        status: "unread",
        courseId: course._id,
      });
    })
  );

  // Gửi thông báo qua socket.io cho tất cả người dùng
  io.to("allUsers").emit("newCourse", {
    message: `Khóa học mới: ${course.name} vừa được thêm! Khám phá ngay.`,
    course: {
      _id: course._id,
      name: course.name,
      thumbnail: course.thumbnail,
      price: course.price,
    },
  });

  return course;
};

export const addLessonToCourseService = async (data: any, files: any) => {
  const {
    courseId,
    title,
    description,
    videoSection,
    videoLength,
    videoPlayer,
    links,
    suggestion,
    questions,
  } = data;

  if (
    !courseId ||
    !title ||
    !description ||
    !videoSection ||
    !videoLength ||
    !videoPlayer
  ) {
    throw new ErrorHandler(
      "Vui lòng cung cấp đầy đủ các trường bắt buộc cho bài học",
      400
    );
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Không tìm thấy khóa học", 404);
  }
  console.log(data);
  console.log(files);
  let videoUrl = "";
  if (files && files.videoFile) {
    const videoFile = files.videoFile[0];
    const myCloud = await cloudinary.v2.uploader.upload(videoFile.path, {
      folder: "courses/videos",
      resource_type: "video",
    });
    videoUrl = myCloud.secure_url;
    fs.unlinkSync(videoFile.path);
  }

  let videoThumbnail: CloudinaryResource = { public_id: "", url: "" };
  if (files && files.thumbnailFile) {
    const thumbnailFile = files.thumbnailFile[0];
    const myCloud = await cloudinary.v2.uploader.upload(thumbnailFile.path, {
      folder: "courses/thumbnails",
      resource_type: "image",
    });
    videoThumbnail = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
    fs.unlinkSync(thumbnailFile.path);
  }

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
  } as ICourseData;

  course.courseData.push(newCourseData);
  await course.save();

  await redis.set(course._id.toString(), JSON.stringify(course), "EX", 604800);

  // Tìm tất cả học viên đã đăng ký khóa học này
  const enrolledUsers = await userModel.find({ "courses.courseId": courseId });
  await Promise.all(
    enrolledUsers.map(async (user) => {
      await NotificationModel.create({
        userId: user._id.toString(),
        title: "Bài Học Mới",
        message: `Bài học mới "${title}" đã được thêm vào khóa học "${course.name}"!`,
        status: "unread",
      });

      io.to(user._id.toString()).emit("newLesson", {
        message: `Bài học mới "${title}" đã được thêm vào khóa học "${course.name}"!`,
        courseId,
        lesson: newCourseData,
      });
    })
  );

  return course;
};
export const editLessonService = async (data: any, files: any) => {
  const {
    courseId,
    lessonId,
    title,
    description,
    videoSection,
    videoLength,
    videoPlayer,
    links,
    suggestion,
    questions,
  } = data;

  if (
    !courseId ||
    !lessonId ||
    !title ||
    !description ||
    !videoSection ||
    !videoLength ||
    !videoPlayer
  ) {
    throw new ErrorHandler(
      "Vui lòng cung cấp đầy đủ các trường bắt buộc cho bài học",
      400
    );
  }

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ErrorHandler("Không tìm thấy khóa học", 404);
  }

  const lessonIndex = course.courseData.findIndex(
    (item: any) => item._id.toString() === lessonId
  );
  if (lessonIndex === -1) {
    throw new ErrorHandler("Không tìm thấy bài học", 404);
  }

  let videoUrl = course.courseData[lessonIndex].videoUrl;
  if (files && files.videoFile) {
    if (videoUrl) {
      const videoPublicId = videoUrl.split("/").pop()?.split(".")[0];
      if (videoPublicId) {
        await cloudinary.v2.uploader.destroy(videoPublicId, {
          resource_type: "video",
        });
      }
    }
    const videoFile = files.videoFile[0];
    const myCloud = await cloudinary.v2.uploader.upload(videoFile.path, {
      folder: "courses/videos",
      resource_type: "video",
    });
    videoUrl = myCloud.secure_url;
    fs.unlinkSync(videoFile.path);
  }

  let videoThumbnail: CloudinaryResource = course.courseData[lessonIndex]
    .videoThumbnail || { public_id: "", url: "" };
  if (files && files.thumbnailFile) {
    if (videoThumbnail.public_id) {
      await cloudinary.v2.uploader.destroy(videoThumbnail.public_id);
    }
    const thumbnailFile = files.thumbnailFile[0];
    const myCloud = await cloudinary.v2.uploader.upload(thumbnailFile.path, {
      folder: "courses/thumbnails",
      resource_type: "image",
    });
    videoThumbnail = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
    fs.unlinkSync(thumbnailFile.path);
  }

  // Cập nhật từng thuộc tính thay vì gán object mới
  course.courseData[lessonIndex].title = title;
  course.courseData[lessonIndex].description = description;
  course.courseData[lessonIndex].videoUrl = videoUrl;
  course.courseData[lessonIndex].videoSection = videoSection;
  course.courseData[lessonIndex].videoLength = Number(videoLength);
  course.courseData[lessonIndex].videoPlayer = videoPlayer;
  course.courseData[lessonIndex].links = links ? JSON.parse(links) : [];
  course.courseData[lessonIndex].suggestion = suggestion || "";
  course.courseData[lessonIndex].questions = questions
    ? JSON.parse(questions)
    : [];
  course.courseData[lessonIndex].videoThumbnail = videoThumbnail;

  await course.save();
  await redis.set(course._id.toString(), JSON.stringify(course), "EX", 604800);

  return course;
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
