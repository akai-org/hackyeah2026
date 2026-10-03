import React from "react";
import { Composition, registerRoot } from "remotion";

import { Main, TOTAL } from "./Main";

const Root: React.FC = () =>
  React.createElement(Composition, {
    id: "HubMI",
    component: Main,
    durationInFrames: TOTAL,
    fps: 30,
    width: 1920,
    height: 1080,
  });

registerRoot(Root);
