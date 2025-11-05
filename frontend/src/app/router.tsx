import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../pages/layouts/Layout";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AppointmentListPage from "../pages/AppointmentPage";
import BookingPage from "../pages/BookingPage";
import SlotsAdminPage from "../pages/Admin/SlotsAdminPage";
import TreatmentsPage from "../pages/TreatmentPage";

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
      { path: "admin/slots", element: <SlotsAdminPage /> },
      { path: "behandlinger", element: <TreatmentsPage /> },
    ],
  },
]);

export default router;
