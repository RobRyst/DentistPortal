import { Outlet } from "react-router-dom";
import NavBar from "../../components/NavBar";

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}
