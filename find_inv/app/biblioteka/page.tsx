import type { Metadata } from "next";

import { InnovationCard } from "@/components/innovation-card";
import { innovations } from "@/data/innovations.mock";

export const metadata: Metadata = { title: "Biblioteka innowacji" };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-deep">Biblioteka innowacji</h1>
      <p className="mt-4 max-w-[60ch] text-lg">
        Wszystkie innowacje w prototypie. To przykładowe opisy, nie prawdziwe realizacje.
      </p>
      <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {innovations.map((innovation) => (
          <li key={innovation.id} className="flex">
            <InnovationCard innovation={innovation} headingLevel="h2" showLink={false} />
          </li>
        ))}
      </ul>
    </div>
  );
}
