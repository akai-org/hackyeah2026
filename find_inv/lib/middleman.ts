import { apiFetch } from "@/lib/api";
import { postSse } from "@/lib/sse";
import type { InnovationCard } from "@/data/innovations";

// Middleman AI (hubmi-backend-plan.md, Agent 5): kilka pytań doprecyzowujących, potem plan wdrożenia.
// POST /api/middleman/start → pierwsze pytanie; POST /api/middleman/answer (SSE) → pytanie albo plan.
// Bez backendu działa scenariusz lokalny: 2 pytania i plan złożony z karty innowacji.

export type Plan = {
  staff_needed: string;
  estimated_cost: string;
  location_suggestions: string;
  steps: string[];
  timeline: string;
  funding_hints: string;
};

export type MiddlemanEvent = { type: "question"; content: string } | { type: "plan"; content: Plan };

export type StartInput = {
  innovation_id: number;
  institution_type: string;
  location: string;
  problem_desc: string;
};

const LOCAL_PREFIX = "local-";

const LOCAL_QUESTIONS = [
  "Ile osób w Waszej instytucji mogłoby się tym zająć i jaki roczny budżet jest realny?",
  "Czy macie miejsce na spotkania, na przykład świetlicę, bibliotekę albo salę w urzędzie? Ile osób chcecie objąć wsparciem na start?",
];

type LocalSession = { input: StartInput; innovation: InnovationCard | null; answers: string[] };
const localSessions = new Map<string, LocalSession>();

export async function startMiddleman(
  input: StartInput,
  innovation: InnovationCard | null,
): Promise<{ session_id: string; first_question: string }> {
  try {
    return await apiFetch<{ session_id: string; first_question: string }>("/api/middleman/start", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    const session_id = LOCAL_PREFIX + crypto.randomUUID();
    localSessions.set(session_id, { input, innovation, answers: [] });
    return { session_id, first_question: LOCAL_QUESTIONS[0] };
  }
}

function isPlan(value: unknown): value is Plan {
  return !!value && typeof value === "object" && Array.isArray((value as Plan).steps);
}

/** Zdarzenie z tekstu: { type, content } albo sam plan jako obiekt. */
function parseEvent(text: string): MiddlemanEvent | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const event = parsed as { type?: string; content?: unknown };
      if (event.type === "plan" && isPlan(event.content)) return { type: "plan", content: event.content };
      if (event.type === "question" && typeof event.content === "string")
        return { type: "question", content: event.content };
      if (isPlan(parsed)) return { type: "plan", content: parsed };
    }
  } catch {
    // Nie JSON: fragment tekstu.
  }
  return null;
}

function localPlan(session: LocalSession): Plan {
  const { innovation, input, answers } = session;
  const months = innovation?.implementation_time_months ?? 3;
  const cost =
    innovation?.cost_level === "high"
      ? "40–80 tys. zł rocznie"
      : innovation?.cost_level === "medium"
        ? "15–30 tys. zł rocznie"
        : "5–10 tys. zł rocznie";
  const place = input.location ? ` w miejscowości ${input.location}` : "";

  return {
    staff_needed: `1 koordynator na część etatu (${input.institution_type}) i 4–8 wolontariuszy. Wasza odpowiedź o zespole i budżecie: „${answers[0] ?? "do uzupełnienia"}”.`,
    estimated_cost: `${cost}. Największe pozycje: wynagrodzenie koordynatora, materiały, dojazdy i ubezpieczenie wolontariuszy.`,
    location_suggestions: `${answers[1] ? `Wasza propozycja: „${answers[1]}”. ` : ""}Dobrze sprawdzają się świetlica wiejska, biblioteka gminna albo sala w ośrodku pomocy społecznej${place}.`,
    steps: [
      `Porozmawiaj z realizatorami „${innovation?.title ?? "innowacji"}” (${innovation?.where_implemented ?? "gminy z Biblioteki"}) i poproś o materiały.`,
      "Wyznacz koordynatora i podpisz porozumienie z partnerem (NGO, parafia, koło gospodyń).",
      "Zrekrutuj i przeszkol wolontariuszy, przygotuj prosty regulamin.",
      "Przeprowadź kampanię informacyjną: ogłoszenia w OPS, parafii, sklepie i u sołtysa.",
      `Uruchom pilotaż na ${months} ${months === 1 ? "miesiąc" : months < 5 ? "miesiące" : "miesięcy"} i zbieraj opinie uczestników.`,
      "Po pilotażu podsumuj wyniki i zdecyduj o stałym finansowaniu.",
    ],
    timeline: `${months + 1} ${months + 1 < 5 ? "miesiące" : "miesięcy"} od decyzji do pierwszych efektów (w tym ${months} mies. pilotażu).`,
    funding_hints:
      "Fundusz Inicjatyw Obywatelskich (FIO), PFRON, EFS+ w ramach FEM 2021–2027, budżet gminy, fundusz sołecki.",
  };
}

async function* localAnswer(sessionId: string, answer: string): AsyncGenerator<MiddlemanEvent> {
  const session = localSessions.get(sessionId);
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (!session) {
    yield { type: "question", content: "Sesja wygasła. Zacznij rozmowę od nowa." };
    return;
  }
  session.answers.push(answer);
  if (session.answers.length < LOCAL_QUESTIONS.length) {
    yield { type: "question", content: LOCAL_QUESTIONS[session.answers.length] };
  } else {
    yield { type: "plan", content: localPlan(session) };
  }
}

export async function* answerMiddleman(sessionId: string, answer: string): AsyncGenerator<MiddlemanEvent> {
  if (sessionId.startsWith(LOCAL_PREFIX)) {
    yield* localAnswer(sessionId, answer);
    return;
  }

  // Backend wysyła całe zdarzenia JSON; gdy model streamuje tekst kawałkami, składamy go do końca.
  let text = "";
  for await (const data of postSse("/api/middleman/answer", { session_id: sessionId, answer })) {
    const event = parseEvent(data);
    if (event) {
      yield event;
      text = "";
    } else {
      text += data;
    }
  }
  if (text.trim()) yield parseEvent(text) ?? { type: "question", content: text.trim() };
}
