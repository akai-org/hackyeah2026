"use client";

import { useEffect, useState } from "react";

const AUDIENCES = ["Seniorzy", "Niewidomi", "Małe firmy"];

export function RotatingAudienceHeading({ id }: { id: string }) {
  const [audienceIndex, setAudienceIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAudienceIndex((current) => (current + 1) % AUDIENCES.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <h2 id={id} className="text-2xl font-medium text-deep">
      Popularne innowacje dla: <span aria-live="polite" className="font-bold text-leaf">{AUDIENCES[audienceIndex]}</span>
    </h2>
  );
}