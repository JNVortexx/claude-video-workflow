import { Composition } from "remotion";
import { Pushups, DURATION } from "./Pushups";

export const Root = () => (
  <Composition id="Pushups" component={Pushups} durationInFrames={DURATION} fps={24} width={1080} height={1920} />
);
