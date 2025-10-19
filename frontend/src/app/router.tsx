import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../pages/layouts/layout";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AppointmentPage from "../pages/AppointmentPage";
import BookingPage from "../pages/BookingPage";

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
      { index: true, element: <AppointmentPage /> },
      { path: "book", element: <BookingPage /> },
      { path: "behandlinger", element: <div>Behandlinger</div> },
    ],
  },
]);

export default router;
