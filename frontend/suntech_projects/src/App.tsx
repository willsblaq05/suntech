import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AdminAuthProvider } from "./auth/AdminAuthProvider";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { Footer } from "./components/layout/Footer";
import { Navbar } from "./components/layout/Navbar";
import { Hero } from "./components/sections/Hero";
import { TrustSection } from "./components/sections/TrustSection";
import { SegmentCards } from "./components/sections/SegmentCards";
import { HowItWorks } from "./components/sections/HowItWorks";
import { FinalCta } from "./components/sections/FinalCta";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminInquiries } from "./pages/admin/AdminInquiries";
import { AdminInquiryDetail } from "./pages/admin/AdminInquiryDetail";

const SKIP_LINK_CLASSES =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white";

/** The public landing page — unchanged. Anchor links (#get-a-quote, ...)
 *  keep working because they are fragment URLs on this route. */
function PublicSite() {
  return (
    <>
      <a href="#main" className={SKIP_LINK_CLASSES}>
        Skip to main content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustSection />
        <SegmentCards />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Every /admin/* route below requires a session. */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="inquiries/:id" element={<AdminInquiryDetail />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
