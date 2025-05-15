import NotificationModel from "../models/notification.Model";
import ErrorHandler from "../utils/ErrorHandler";

// Lấy tất cả thông báo (cho admin)
export const getNotificationsService = async () => {
  const notifications = await NotificationModel.find().sort({
    createdAt: -1,
  });
  return notifications;
};

// Lấy thông báo cho user cụ thể
export const getUserNotificationsService = async (userId: string) => {
  const notifications = await NotificationModel.find({
    userId: userId,
  }).sort({
    createdAt: -1,
  });
  return notifications;
};

// Tạo thông báo mới khi mua khóa học
export const createCourseNotification = async (
  userId: string,
  courseId: string,
  courseName: string
) => {
  try {
    await NotificationModel.create({
      userId: userId,
      title: "Mua khóa học thành công",
      message: `Bạn đã mua thành công khóa học "${courseName}"`,
      courseId: courseId,
      status: "unread",
    });
  } catch (error: any) {
    throw new ErrorHandler("Lỗi khi tạo thông báo", 500);
  }
};

export const updateNotificationService = async (notificationId: string) => {
  const notification = await NotificationModel.findById(notificationId);
  if (!notification) {
    throw new ErrorHandler("Không tìm thấy thông báo", 404);
  }

  notification.status = "read";
  await notification.save();

  const notifications = await NotificationModel.find().sort({
    createdAt: -1,
  });

  return notifications;
};
