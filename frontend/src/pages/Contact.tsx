import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold mb-2">Kontakt oss</h1>
        <p className="text-gray-600">
          Ta kontakt med RystDental – vi hjelper deg gjerne.
        </p>
      </header>

      <section className="rounded-2xl border p-6 shadow-sm bg-white space-y-4">
        <h2 className="text-xl font-medium mb-2">RystDental</h2>

        <div className="flex items-center gap-3 text-gray-800">
          <Phone className="w-5 h-5 text-blue-600" />
          <span>
            Telefon: <strong>22 00 00 00</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-800">
          <Mail className="w-5 h-5 text-blue-600" />
          <span>
            E-post:{" "}
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
            Adresse:{" "}
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
          <span>Åpningstider: Man–Fre 08:00–16:00</span>
        </div>
      </section>

      <section className="rounded-2xl border p-6 shadow-sm bg-white space-y-4">
        <h2 className="text-xl font-medium mb-2">Akutt hjelp</h2>
        <p>
          Ved akutte tannproblemer kan du ringe oss på{" "}
          <strong>22 00 00 00</strong> og taste 9 for akutt.
        </p>
        <p>
          Dersom det er alvorlig skade eller fare for liv og helse, ring{" "}
          <strong>113</strong> umiddelbart.
        </p>
      </section>
    </main>
  );
}
