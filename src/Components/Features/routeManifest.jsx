/**
 * Single route + navigation manifest for all role dashboards.
 *
 * The three former role trees (Admin/Staff/Alumni) are now ONE component set,
 * mounted under /admin, /staff and /alumni by RoleLayout. Each entry declares:
 *   - path        route path relative to the role base
 *   - element     the shared component
 *   - permission  RBAC codename required to see the nav item / open the route
 *                 (undefined = available to any authenticated user)
 *   - nav         { label, icon } when the route appears in the header nav
 *   - detail      true for detail/sub routes that don't get their own nav item
 *
 * Admin decides, at runtime, which roles hold which permission — so what each
 * user sees is driven entirely by the permission matrix, not hardcoded per role.
 */
import {
  faHome, faCalendarCheck, faPhotoFilm, faNewspaper, faIdBadge,
  faBirthdayCake, faBriefcase, faBuilding, faUser, faHandHoldingHeart,
  faComments, faClipboardList, faFileImport, faUserShield,
  // faEnvelope, // was only used by the disabled sendmail feature
  faUserPlus, faMap,
} from "@fortawesome/free-solid-svg-icons";

// Feature components (shared across roles)
import Dashboard from "./Dashboard/Dashboard";
import AddEvent from "./Events/Addevents";
import EditEvent from "./Events/Editevent";
import Events from "./Events/Events";
import AlbumsPage from "./Albums/Albums";
import AlbumDetailPage from "./Albums/Albumsdetails";
import StudentImageUpload from "./Students";
import Map from "./Map.jsx/Map";
import NewsRoom from "./News/News";
import Members from "./Members/Members";
import Addpost from "./Post/Addpost";
import Birthday from "./Birthday/Birthday";
import BusinessDirectory from "./Business/BusinessDirectory";
import BusinessDetail from "./Business/BusinessDetail";
import Myprofile from "./Myprofile/Myprofile";
import Mycontribution from "./Mycontribution/Mycontributation";
import Chat from "./Chat/Chat";
import RegisterRequestPage from "./Auth/LoginRequest";
// Sendmail feature disabled — no longer offered
// import SendMail from "./mail/sendmail";
import AuditPage from "./Audit/AuditPage";
import RolesPermissionsPage from "./RBAC/RolesPermissionsPage";
import MemberImport from "./MemberImport/MemberImport";

// Shared detail views (already role-agnostic via basePath prop)
import {
  EventDetailView, NewsDetailView, MemberDetailView,
  BusinessDetailView, JobDetailView,
} from "../Shared/detail";
import ChapterDetail from "../Shared/ChapterDetail";

// Entry: { path, element, permission?, nav?, detail? }
// `element` may be a component (rendered as-is) or a function (base) => element,
// used for detail views that need the basePath prop.
export const ROUTE_MANIFEST = [
  { path: "dashboard", element: Dashboard, nav: { label: "Home", icon: faHome } },

  // Events
  { path: "event", element: AddEvent, permission: "events.view", nav: { label: "Events", icon: faCalendarCheck } },
  { path: "event/:id", element: (base) => <EventDetailView basePath={base} />, factory: true, detail: true },
  { path: "event/:id/edit", element: EditEvent, permission: "events.create", detail: true },

  // Albums
  { path: "albums", element: AlbumsPage, permission: "albums.view", nav: { label: "Albums", icon: faPhotoFilm } },
  { path: "albums/:albumId", element: AlbumDetailPage, detail: true },

  // Students (image upload) — admin/staff capability
  { path: "students", element: StudentImageUpload, permission: "students.manage", detail: true },

  // Map
  { path: "map", element: Map, nav: { label: "Map", icon: faMap } },

  // News
  { path: "news", element: NewsRoom, permission: "news.view", nav: { label: "News", icon: faNewspaper } },
  { path: "news/:id", element: (base) => <NewsDetailView basePath={base} />, factory: true, detail: true },

  // Members
  { path: "members", element: Members, permission: "members.view", nav: { label: "Members", icon: faIdBadge } },
  { path: "members/:name", element: (base) => <MemberDetailView basePath={base} />, factory: true, detail: true },

  // Jobs / feed
  { path: "jobs", element: Addpost, permission: "jobs.view", nav: { label: "Jobs", icon: faBriefcase } },
  { path: "jobs/:id", element: (base) => <JobDetailView basePath={base} />, factory: true, detail: true },

  // Birthdays
  { path: "birthday", element: Birthday, nav: { label: "Birthdays", icon: faBirthdayCake } },

  // Business
  { path: "business", element: BusinessDirectory, permission: "business.view", nav: { label: "Business", icon: faBuilding } },
  { path: "business/add", element: BusinessDetail, permission: "business.create", detail: true },
  { path: "business/edit/:id", element: BusinessDetail, permission: "business.create", detail: true },
  { path: "business/:id", element: BusinessDetail, detail: true },
  { path: "business/view/:id", element: (base) => <BusinessDetailView basePath={base} />, factory: true, detail: true },

  // Self
  { path: "my-profile", element: Myprofile, nav: { label: "Profile", icon: faUser } },
  { path: "my-contribution", element: Mycontribution, nav: { label: "My Uploads", icon: faHandHoldingHeart } },
  { path: "chat", element: Chat, nav: { label: "Chat", icon: faComments } },
  { path: "chapters/:type/:value", element: ChapterDetail, detail: true },

  // Privileged (permission-gated) — appear in nav only for users who hold them
  { path: "register-request", element: RegisterRequestPage, permission: "members.approve_signups", nav: { label: "Requests", icon: faUserPlus } },
  { path: "import-members", element: MemberImport, permission: "members.import", nav: { label: "Import", icon: faFileImport } },
  // Sendmail feature disabled — no longer offered
  // { path: "sendmail", element: SendMail, permission: "email.send", nav: { label: "Mail", icon: faEnvelope } },
  { path: "audit", element: AuditPage, permission: "audit.view", nav: { label: "Audit", icon: faClipboardList } },
  { path: "roles", element: RolesPermissionsPage, permission: "rbac.manage", nav: { label: "Roles", icon: faUserShield } },
];
