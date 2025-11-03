import { Outlet } from "react-router-dom";
import NavBar from "../../components/NavBar";
import NoupeChatbot from "../../components/ChatBot";

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <NoupeChatbot />
    </>
  );
}
