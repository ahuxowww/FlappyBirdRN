import React from 'react';
import {
  Canvas,
  Circle,
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
  cancelAnimation,
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
  const birdY = useSharedValue(height / 3);
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
  const gameOver = useSharedValue(false);
  const birdCenterX = useDerivedValue(() => birdX.x + 24);
  const birdCenterY = useDerivedValue(() => birdY.value + 12);
  const moveTheMap = () => {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, {duration: 3000, easing: Easing.linear}),
        withTiming(width, {duration: 0}),
      ),
      -1,
    );
  };

  React.useEffect(() => {
    moveTheMap();
  }, [moveTheMap]);

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

  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }

      //bottom
      if (
        birdCenterX.value >= pipeX.value &&
        birdCenterX.value <= pipeX.value + 104 &&
        birdCenterY.value >= height - 320 - pipeOffset &&
        birdCenterY.value <= height - 320 - pipeOffset + 104
      ) {
        gameOver.value = true;
      }

      //top
      if (
        birdCenterX.value >= pipeX.value &&
        birdCenterX.value <= pipeX.value + 104 &&
        birdCenterY.value >= pipeOffset - 320 &&
        birdCenterY.value <= pipeOffset - 320 + 104
      ) {
        gameOver.value = true;
      }
    },
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    },
  );

  useFrameCallback(({timeSincePreviousFrame: dt}) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    'worklet';
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    pipeX.value = width;
    gameOver.value = false;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      restartGame();
    } else {
      birdYVelocity.value = -300;
    }
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
          <Circle cy={birdCenterY} cx={birdCenterX} r={10} />
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
