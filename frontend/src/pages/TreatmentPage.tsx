import { useNavigate } from "react-router-dom";

type Treatment = {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: string;
};

const treatments: Treatment[] = [
  {
    id: 1,
    title: "Dental Check-up",
    description:
      "A routine examination of teeth and gums, including cleaning and consultation.",
    duration: "30 minutes",
    price: "500 NOK",
  },
  {
    id: 2,
    title: "Teeth Whitening",
    description:
      "Professional whitening treatment to remove stains and brighten your smile.",
    duration: "60 minutes",
    price: "1 200 NOK",
  },
  {
    id: 3,
    title: "Filling / Restoration",
    description:
      "Repair cavities and restore your tooth with high-quality composite filling.",
    duration: "45 minutes",
    price: "800 NOK",
  },
  {
    id: 4,
    title: "Root Canal",
    description:
      "Endodontic treatment for infected or damaged tooth nerves, preserving the tooth.",
    duration: "90 minutes",
    price: "2 500 NOK",
  },
  {
    id: 5,
    title: "Dental Implant Consultation",
    description:
      "Discuss options for replacing missing teeth with a dental implant specialist.",
    duration: "30 minutes",
    price: "600 NOK",
  },
];

export default function TreatmentsPage() {
  const navigate = useNavigate();

  const handleBook = (treatment: Treatment) => {
    navigate("/book", { state: { treatment: treatment } });
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold mb-6">Treatments</h1>

      <div className="grid sm:grid-cols-2 gap-6">
        {treatments.map((treatment) => (
          <div
            key={treatment.id}
            className="border rounded-2xl shadow-sm p-6 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">{treatment.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {treatment.description}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              <strong>Duration:</strong> {treatment.duration}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Price:</strong> {treatment.price}
            </p>
            <button
              onClick={() => handleBook(treatment)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Book now
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
