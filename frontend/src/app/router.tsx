import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import BookingPage from "../pages/BookingPage";
import AppointmentPage from "../pages/AppointmentPage";
import DashboardPage from "../pages/Admin/DashboardPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <AppointmentPage /> },
      { path: "booking", element: <BookingPage /> },
      { path: "admin", element: <DashboardPage /> },
    ],
  },
]);
