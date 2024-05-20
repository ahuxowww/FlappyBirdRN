import React from 'react';
import {
  Canvas,
  Circle,
  Group,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import {useWindowDimensions} from 'react-native';
import {
  Easing,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GRAVITY = 9.8; //m/s
const App = () => {
  const {height, width} = useWindowDimensions();
  const bg = useImage(require('./assets/Image/background-day.png'));
  const bird = useImage(require('./assets/Image/yellowbird-downflap.png'));
  const pipe = useImage(require('./assets/Image/pipe-green.png'));
  const pipeTop = useImage(require('./assets/Image/pipe-green-top.png'));
  const base = useImage(require('./assets/Image/base.png'));

  const pipeOffset = 0;

  const pipeX = useSharedValue(width);
  const birdY = useSharedValue(height / 2);
  const birdYVelocity = useSharedValue(100);

  useFrameCallback(({timeSincePreviousFrame: dt}) => {
    if (!dt) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;

  });

  React.useEffect(() => {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, {duration: 3000, easing: Easing.linear}),
        withTiming(width, {duration: 0}),
      ),
      -1,
    );
  }, [birdY, height, pipeX, width]);

  return (
    <Canvas
      style={{width, height}}
      onTouch={() => (birdYVelocity.value = -100)}>
      <Image image={bg} fit={'cover'} width={width} height={height} />
      <Image
        image={pipe}
        width={104}
        height={640}
        x={pipeX}
        y={height - 320 - pipeOffset}
      />
      <Image
        image={pipeTop}
        width={104}
        height={640}
        x={pipeX}
        y={-320 - pipeOffset}
      />
      <Image image={base} x={0} y={height - 75} width={width} height={150} />

      <Image image={bird} x={120} y={birdY} width={32} height={24} />
    </Canvas>
  );
};
export default App;
