import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../pages/layouts/Layout";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AppointmentListPage from "../pages/AppointmentPage";
import BookingPage from "../pages/BookingPage";
import SlotsAdminPage from "../pages/Admin/SlotsAdminPage";
import TreatmentsPage from "../pages/TreatmentPage";
import AdminRoute from "../components/AdminRoute";
import ContactPage from "../pages/Contact";
import AdminAppointmentsPage from "../pages/Admin/AdminAppointmentsPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AppointmentListPage /> },
      { path: "book", element: <BookingPage /> },
      { path: "admin", element: <Navigate to="admin/slots" replace /> },
      { path: "kontakt", element: <ContactPage /> },
      {
        path: "admin/appointments",
        element: (
          <AdminRoute>
            <SlotsAdminPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/slots",
        element: (
          <AdminRoute>
            <AdminAppointmentsPage />
          </AdminRoute>
        ),
      },
      { path: "treatments", element: <TreatmentsPage /> },
    ],
  },
]);

export default router;
