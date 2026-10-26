import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "@/lib/session";
import { FamilyLayout } from "@/components/FamilyLayout";
import { Loading, Notice } from "@/components/ui";
import Landing from "@/pages/Landing";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";
import { ForgotPage, LoginPage, RegisterPage } from "@/pages/Auth";
import { InvitePage, OnboardingPage } from "@/pages/Onboarding";
import Overview from "@/pages/Overview";
import Timeline from "@/pages/Timeline";
import { EditMemoryPage, MemoryDetailPage, NewMemoryPage } from "@/pages/MemoryPages";
import { EditPersonPage, MembersPage, NewPersonPage, PersonPage } from "@/pages/PeoplePages";
import TreePage from "@/pages/Tree";
import { LettersPage } from "@/pages/Soon";
import { NewStoryPage, StoriesPage } from "@/pages/Stories";
import Manage from "@/pages/Manage";
import Settings from "@/pages/Settings";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function SkipLink() {
  return <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-warm">Bỏ qua, đến nội dung chính</a>;
}

/** Trang cần đăng nhập (ngoài khu vực gia đình). */
function RequireUser({ children }: { children: ReactNode }) {
  const s = useSession();
  const loc = useLocation();
  if (s.loading) return <Loading />;
  if (!s.user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}

/** Đã đăng nhập thì không cần trang đăng nhập/đăng ký nữa. */
function GuestOnly({ children }: { children: ReactNode }) {
  const s = useSession();
  const loc = useLocation();
  if (s.loading) return <Loading />;
  if (s.user && !new URLSearchParams(loc.search).get("next")) return <Navigate to="/family" replace />;
  return <>{children}</>;
}

function Shell() {
  const s = useSession();
  if (s.error) {
    return <div className="container-page max-w-read py-20"><Notice kind="error">Website chưa kết nối được Firebase ({s.error}). Xem README, mục “Cài đặt Firebase”.</Notice></div>;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/invite/:fid/:token" element={<InvitePage />} />
      <Route path="/onboarding" element={<RequireUser><OnboardingPage /></RequireUser>} />
      <Route path="/settings" element={<RequireUser><Settings /></RequireUser>} />
      <Route path="/family" element={<FamilyLayout />}>
        <Route index element={<Overview />} />
        <Route path="memories" element={<Timeline />} />
        <Route path="memories/new" element={<NewMemoryPage />} />
        <Route path="memories/:id" element={<MemoryDetailPage />} />
        <Route path="memories/:id/edit" element={<EditMemoryPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/new" element={<NewPersonPage />} />
        <Route path="members/:id" element={<PersonPage />} />
        <Route path="members/:id/edit" element={<EditPersonPage />} />
        <Route path="tree" element={<TreePage />} />
        <Route path="stories" element={<StoriesPage />} />
        <Route path="stories/new" element={<NewStoryPage />} />
        <Route path="letters" element={<LettersPage />} />
        <Route path="manage" element={<Manage />} />
        <Route path="*" element={<NotFound inside />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <SkipLink />
        <ScrollToTop />
        <Shell />
      </SessionProvider>
    </BrowserRouter>
  );
}
