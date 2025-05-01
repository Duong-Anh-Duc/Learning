// frontend/types/courses.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  courses?: Array<{ courseId: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewType {
  user: User;
  rating?: number;
  comment: string;
  commentReplies?: ReviewType[];
}

export interface PrerequisiteType {
  title: string;
}

export interface BenefitType {
  title: string;
}

export interface CommentType {
  _id: string;
  user: User;
  question: string;
  questionReplies: CommentType[];
}

export interface LinkType {
  title: string;
  url: string;
}

export interface CourseDataType {
  _id: string | any;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail?: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: LinkType[];
  suggestion: string;
  questions: CommentType[];
}

export interface CoursesType {
  _id: any;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string | any;
    url: string | any;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: BenefitType[];
  prerequisites: PrerequisiteType[];
  reviews: ReviewType[];
  courseData: CourseDataType[];
  ratings?: number;
  purchased: number;
}

export interface CategoryType {
  title: string;
  // Thêm các thuộc tính khác nếu cần
}