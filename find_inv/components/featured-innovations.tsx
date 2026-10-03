"use client";

import { useEffect, useState } from "react";

import { MatchCard } from "@/components/match-card";
import { MOCK_INNOVATIONS, type InnovationCard } from "@/data/innovations";
import { listInnovations } from "@/lib/knowledge";

// Kilka innowacji z Biblioteki na stronie głównej. Na starcie dane mock (bez migania pustej sekcji),
// po odpowiedzi backendu prawdziwe karty ROPS.

const INITIAL = MOCK_INNOVATIONS.filter((innovation) => innovation.status === "active").slice(0, 3);

export function FeaturedInnovations() {
  const [innovations, setInnovations] = useState<InnovationCard[]>(INITIAL);

  useEffect(() => {
    listInnovations({ limit: 3 }).then((result) => {
      if (result.innovations.length) setInnovations(result.innovations.slice(0, 3));
    });
  }, []);

  return (
    <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {innovations.map((innovation) => (
        <li key={innovation.id} className="flex">
          <MatchCard innovation={innovation} />
        </li>
      ))}
    </ul>
  );
}
