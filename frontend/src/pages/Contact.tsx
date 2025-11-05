import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold mb-2">Contact Us</h1>
        <p className="text-gray-600">
          Get in touch with RystDental – we’re here to help.
        </p>
      </header>

      <section className="rounded-2xl border p-6 shadow-sm bg-white space-y-4">
        <h2 className="text-xl font-medium mb-2">RystDental</h2>

        <div className="flex items-center gap-3 text-gray-800">
          <Phone className="w-5 h-5 text-blue-600" />
          <span>
            Phone: <strong>+47 22 00 00 00</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-800">
          <Mail className="w-5 h-5 text-blue-600" />
          <span>
            Email:{" "}
            <a
              href="mailto:post@rystdental.no"
              className="text-blue-600 hover:underline"
            >
              post@rystdental.no
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-800">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span>
            Address:{" "}
            <a
              href="https://www.google.com/maps/place/Rystadveien+10,+1337+Fredrikstad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Rystadveien 10, 1337 Fredrikstad
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-800">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Opening hours: Mon – Fri 08:00 – 16:00</span>
        </div>
      </section>

      <section className="rounded-2xl border p-6 shadow-sm bg-white space-y-4">
        <h2 className="text-xl font-medium mb-2">Emergency Help</h2>
        <p>
          For urgent dental problems, please call{" "}
          <strong>+47 22 00 00 00</strong> and press 9 for emergencies.
        </p>
        <p>
          If it’s a serious injury or a situation that may threaten life or
          health, call <strong>113</strong> immediately.
        </p>
      </section>

      <section className="text-center text-gray-500 text-sm">
        <p>
          Find more information at{" "}
          <a
            href="https://www.rystdental.no"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            www.rystdental.no
          </a>
        </p>
      </section>
    </main>
  );
}
