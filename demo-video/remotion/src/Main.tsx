import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

import { Progress, Swoosh, SWOOSH_CUT, SWOOSH_LEN } from "./components/Overlays";
import { AdminScene, ChatScene, DataScene, MiddlemanScene, MontageScene, SearchScene } from "./scenes/AppScenes";
import { Intro } from "./scenes/Intro";
import { LogoReveal } from "./scenes/Logo";

// Oś czasu 60 s @ 30 fps. Każda granica scen (poza intro→logo i wyniki→czat) ma przejście „wycinanka".
export const SCENES = [
  { id: "intro", from: 0, len: 135, el: <Intro />, swoosh: false },
  { id: "logo", from: 135, len: 90, el: <LogoReveal />, swoosh: true },
  { id: "search", from: 225, len: 390, el: <SearchScene />, swoosh: true },
  { id: "chat", from: 615, len: 150, el: <ChatScene />, swoosh: false },
  { id: "middleman", from: 765, len: 390, el: <MiddlemanScene />, swoosh: true },
  { id: "data", from: 1155, len: 195, el: <DataScene />, swoosh: true },
  { id: "montage", from: 1350, len: 165, el: <MontageScene />, swoosh: true },
  { id: "admin", from: 1515, len: 165, el: <AdminScene />, swoosh: true },
  { id: "outro", from: 1680, len: 120, el: <LogoReveal outro />, swoosh: true },
];

export const TOTAL = 1800;

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: "#EEF3EA" }}>
    {SCENES.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.len} name={s.id}>
        {s.el}
      </Sequence>
    ))}
    {SCENES.filter((s) => s.swoosh).map((s) => (
      <Sequence key={`sw-${s.id}`} from={s.from - SWOOSH_CUT} durationInFrames={SWOOSH_LEN} name={`swoosh→${s.id}`}>
        <Swoosh />
      </Sequence>
    ))}
    <Progress />
  </AbsoluteFill>
);
