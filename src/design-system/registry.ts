/*
 * Every design-system component, one entry per folder. The name is the one Figma and
 * Storybook will use; the tier is the first part of the path (atoms → molecules →
 * organisms → templates). design-system.test.ts keeps this list and the folders in step.
 * Figma node ids and versions join each entry when the Figma library is built.
 */

export type Tier = "atoms" | "molecules" | "organisms" | "templates";
export type RegistryEntry = { name: string; path: `${Tier}/${string}` };

export const registry: RegistryEntry[] = [
  // atoms
  { name: "Avatar", path: "atoms/avatar" },
  { name: "Badge", path: "atoms/badge" },
  { name: "BookFace", path: "atoms/book-face" },
  { name: "Button", path: "atoms/button" },
  { name: "Card", path: "atoms/card" },
  { name: "CheckMark", path: "atoms/check-mark" },
  { name: "Checkbox", path: "atoms/checkbox" },
  { name: "Chip", path: "atoms/chip" },
  { name: "ContentIcon", path: "atoms/content-icon" },
  { name: "CountUp", path: "atoms/count-up" },
  { name: "FacebookMark", path: "atoms/facebook-mark" },
  { name: "HoldButton", path: "atoms/hold-button" },
  { name: "IconButton", path: "atoms/icon-button" },
  { name: "IconTile", path: "atoms/icon-tile" },
  { name: "Logo", path: "atoms/logo" },
  { name: "Odometer", path: "atoms/odometer" },
  { name: "Progress", path: "atoms/progress" },
  { name: "Skeleton", path: "atoms/skeleton" },
  { name: "SuperPrepMark", path: "atoms/superprep-mark" },
  { name: "SuperPrepRing", path: "atoms/superprep-ring" },
  { name: "TreeArt", path: "atoms/tree-art" },

  // molecules
  { name: "BottomSheet", path: "molecules/bottom-sheet" },
  { name: "Breadcrumb", path: "molecules/breadcrumb" },
  { name: "BriefTicker", path: "molecules/brief-ticker" },
  { name: "CategoryFilter", path: "molecules/category-filter" },
  { name: "CheckboxRow", path: "molecules/checkbox-row" },
  { name: "ClassRow", path: "molecules/class-row" },
  { name: "ClassTile", path: "molecules/class-tile" },
  { name: "ClassesTabs", path: "molecules/classes-tabs" },
  { name: "CourseCover", path: "molecules/course-cover" },
  { name: "EmptyState", path: "molecules/empty-state" },
  { name: "MiniShelf", path: "molecules/mini-shelf" },
  { name: "NoticeList", path: "molecules/notice-list" },
  { name: "NoticeRead", path: "molecules/notice-read" },
  { name: "ResumeStrip", path: "molecules/resume-strip" },
  { name: "Receipt", path: "molecules/receipt" },
  { name: "SectionCard", path: "molecules/section-card" },
  { name: "SectionError", path: "molecules/section-error" },
  { name: "Segmented", path: "molecules/segmented" },
  { name: "Select", path: "molecules/select" },
  { name: "ShelfTabs", path: "molecules/shelf-tabs" },
  { name: "StatTile", path: "molecules/stat-tile" },
  { name: "StorySegments", path: "molecules/story-segments" },
  { name: "SubjectAccordion", path: "molecules/subject-accordion" },
  { name: "SubjectFilter", path: "molecules/subject-filter" },
  { name: "SuperPrepLink", path: "molecules/superprep-link" },
  { name: "TaskRow", path: "molecules/task-row" },
  { name: "TaskTile", path: "molecules/task-tile" },

  // organisms
  { name: "ClassesCard", path: "organisms/dashboard/classes-card" },
  { name: "CoursesCard", path: "organisms/dashboard/courses-card" },
  { name: "LiveHero", path: "organisms/dashboard/live-hero" },
  { name: "NoticesCard", path: "organisms/dashboard/notices-card" },
  { name: "PromoCard", path: "organisms/dashboard/promo-card" },
  { name: "QuickRail", path: "organisms/dashboard/quick-rail" },
  { name: "RecentCard", path: "organisms/dashboard/recent-card" },
  { name: "RecommendationsCard", path: "organisms/dashboard/recommendations-card" },
  { name: "StreakPopup", path: "organisms/dashboard/streak-popup" },
  { name: "StreakTreeCard", path: "organisms/dashboard/streak-tree-card" },
  { name: "SubjectGroup", path: "organisms/dashboard/subject-group" },
  { name: "SubjectsCard", path: "organisms/dashboard/subjects-card" },
  { name: "SuperPrepCard", path: "organisms/dashboard/superprep-card" },
  { name: "TasksCard", path: "organisms/dashboard/tasks-card" },
  { name: "WelcomeCard", path: "organisms/dashboard/welcome-card" },
  { name: "BottomNav", path: "organisms/header/bottom-nav" },
  { name: "ExploreMenu", path: "organisms/header/explore-menu" },
  { name: "PublicNav", path: "organisms/header/public-nav" },
  { name: "HeaderActions", path: "organisms/header/header-actions" },
  { name: "InboxMenu", path: "organisms/header/inbox-menu" },
  { name: "ProfileMenu", path: "organisms/header/profile-menu" },
  { name: "SiteHeader", path: "organisms/header/site-header" },
  { name: "SiteFooter", path: "organisms/footer/site-footer" },
  { name: "LoginBrandPanel", path: "organisms/login/login-brand-panel" },
  { name: "LoginForm", path: "organisms/login/login-form" },
  { name: "StudentCard", path: "organisms/onboarding/student-card" },
  { name: "TenTenSays", path: "organisms/onboarding/tenten-says" },

  // templates
  { name: "DashboardTemplate", path: "templates/dashboard-template" },
  { name: "LoginTemplate", path: "templates/login-template" },
  { name: "OnboardingTemplate", path: "templates/onboarding-template" },
];
