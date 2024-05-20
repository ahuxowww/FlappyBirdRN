import React from 'react';
import {
  Canvas,
  Group,
  Image,
  Text,
  matchFont,
  rotate,
  useImage,
} from '@shopify/react-native-skia';
import {Platform, useWindowDimensions} from 'react-native';
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const GRAVITY = 500; //m/s
const App = () => {
  const {height, width} = useWindowDimensions();
  const fontFamily = Platform.select({ios: 'Helvetica', default: 'serif'});
  const fontStyle = {
    fontFamily,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  };
  const font = matchFont(fontStyle);
  const [score, setScore] = React.useState(0);
  const bg = useImage(require('./assets/Image/background-day.png'));
  const bird = useImage(require('./assets/Image/yellowbird-downflap.png'));
  const pipe = useImage(require('./assets/Image/pipe-green.png'));
  const pipeTop = useImage(require('./assets/Image/pipe-green-top.png'));
  const base = useImage(require('./assets/Image/base.png'));

  const pipeOffset = 0;

  const pipeX = useSharedValue(width);
  const birdX = {
    x: width / 4,
  };
  const birdY = useSharedValue(height / 2);
  const birdYVelocity = useSharedValue(100);
  const birdOrigin = useDerivedValue(() => {
    return {x: width / 4 + 24, y: birdY.value + 12};
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP,
        ),
      },
    ];
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

  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX.x / 2;
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue < middle &&
        previousValue > middle
      ) {
        runOnJS(setScore)(score + 1);
      }
    },
  );
  console.log(score);
  useFrameCallback(({timeSincePreviousFrame: dt}) => {
    if (!dt) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = -300;
  });

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{width, height}}>
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
          <Image
            image={base}
            x={0}
            y={height - 75}
            width={width}
            height={150}
          />
          <Group transform={birdTransform} origin={birdOrigin}>
            <Image image={bird} x={birdX.x} y={birdY} width={48} height={24} />
          </Group>
          <Text
            x={width / 2 - 60}
            y={100}
            text={`Score: ${score}`}
            font={font}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
