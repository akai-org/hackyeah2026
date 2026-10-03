import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { Backdrop, Caption, Chapter } from "../components/Overlays";
import { BrowserWindow } from "../components/Window";
import { ADMIN, CHAT, GAP, KREATOR, MIDDLEMAN, SEARCH, SIMPLE, STATS } from "../shots";

/** Szybki „przewrót strony" między dwoma ujęciami w jednej scenie. */
const Whip: React.FC<{ at: number; children: [React.ReactNode, React.ReactNode] }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at - 6, at + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <>
      {frame < at + 6 && <AbsoluteFill style={{ transform: `translateX(${-p * 2100}px) rotate(${-p * 4}deg)` }}>{children[0]}</AbsoluteFill>}
      {frame >= at - 6 && (
        <AbsoluteFill style={{ transform: `translateX(${(1 - p) * 2100}px) rotate(${(1 - p) * 4}deg)` }}>{children[1]}</AbsoluteFill>
      )}
    </>
  );
};

export const SearchScene: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <BrowserWindow shot={SEARCH} />
    <Chapter n="01" label="Matchmaking AI" />
    <Caption title="Opisz problem" sub="Własnymi słowami, jak w rozmowie z pracownikiem OPS. Można też podyktować." from={12} to={122} side="right" top={150} />
    <Caption title="AI rozumie problem" sub="Autotagger nadaje tematy z zamkniętej listy. Widzisz je od razu." from={168} to={252} />
    <Caption title="Co już działa" sub="5 najlepiej dopasowanych innowacji z Biblioteki: dla kogo, gdzie działa, ile kosztuje." from={268} to={384} side="right" />
  </AbsoluteFill>
);

export const ChatScene: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <BrowserWindow shot={CHAT} enterAt={-60} />
    <Chapter n="01" label="Matchmaking AI" />
    <Caption title="Dopytaj AI" sub="Czat odpowiada na podstawie kart znalezionych innowacji." from={10} to={140} side="right" />
  </AbsoluteFill>
);

export const MiddlemanScene: React.FC = () => (
  <AbsoluteFill>
    <Backdrop variant={1} />
    <BrowserWindow shot={MIDDLEMAN} />
    <Chapter n="02" label="Middleman AI" />
    <Caption title="Dostosuj do siebie" sub="Middleman AI przerabia innowację na plan dla Twojej instytucji." from={18} to={128} side="right" />
    <Caption title="Krótka rozmowa" sub="Najwyżej 3 pytania: kto to zrobi, za ile i gdzie." from={140} to={280} side="right" />
    <Caption title="Plan wdrożenia" sub="Cel, zespół, koszty, etapy 30/60/90 dni i źródła finansowania." from={300} to={386} side="right" />
  </AbsoluteFill>
);

export const DataScene: React.FC = () => {
  const { fps } = useVideoConfig();
  const cut = Math.round(2.6 * fps);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Whip at={cut}>
        <BrowserWindow shot={STATS} />
        <Sequence from={cut - 6} layout="none">
          <BrowserWindow shot={GAP} enterAt={-60} />
        </Sequence>
      </Whip>
      <Chapter n="03" label="Zasobnik wiedzy" />
      <Caption title="Kondycja Małopolski" sub="Dane GUS: starzenie, ubóstwo, bezrobocie, niepełnosprawność." from={8} to={72} />
      <Caption title="Gdzie brakuje rozwiązań" sub="Indeks Luki Innowacyjnej: potrzeby kontra liczba innowacji, powiat po powiecie." from={86} to={192} />
    </AbsoluteFill>
  );
};

export const MontageScene: React.FC = () => {
  const { fps } = useVideoConfig();
  const cut = Math.round(3.0 * fps);
  return (
    <AbsoluteFill>
      <Backdrop variant={1} />
      <Whip at={cut}>
        <BrowserWindow shot={KREATOR} />
        <Sequence from={cut - 6} layout="none">
          <BrowserWindow shot={SIMPLE} enterAt={-60} />
        </Sequence>
      </Whip>
      <Chapter n="04" label="Kreator i dostępność" />
      <Caption title="Masz pomysł?" sub="Kreator układa z kilku zdań fiszkę pomysłu z tagami." from={8} to={80} side="right" />
      <Caption title="Prosty widok" sub="Jeden przełącznik: bez kolażu, spokojniej i czytelniej. Projektowane pod WCAG 2.1 AA." from={96} to={162} side="right" />
    </AbsoluteFill>
  );
};

export const AdminScene: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <BrowserWindow shot={ADMIN} />
    <Chapter n="05" label="Panel ROPS" />
    <Caption title="Panel ROPS" sub="Zatwierdzanie innowacji, role użytkowników i trendy: czego szukają mieszkańcy." from={66} to={160} side="right" />
  </AbsoluteFill>
);
