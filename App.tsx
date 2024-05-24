import React, {useCallback} from 'react';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Text,
  matchFont,
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
  const [startGame, setStartGame] = React.useState(true);
  const [gameOverValue, setGameOverValue] = React.useState(false);
  const bg = useImage(require('./assets/Image/background-day.png'));
  const bird = useImage(require('./assets/Image/yellowbird-downflap.png'));
  const pipe = useImage(require('./assets/Image/pipe-green.png'));
  const pipeTop = useImage(require('./assets/Image/pipe-green-top.png'));
  const base = useImage(require('./assets/Image/base.png'));
  const gameOverImage = useImage(require('./assets/Image/gameover.png'));
  const startGameImage = useImage(require('./assets/Image/message.png'));

  const pipeOffset = useSharedValue(0);
  const pipeX = useSharedValue(width);
  const birdX = {
    x: width / 4,
  };
  const birdY = useSharedValue(height / 3);
  const birdYVelocity = useSharedValue(100);
  const birdOrigin = useDerivedValue(() => {
    return {x: width / 4 + 24, y: birdY.value + 12};
  });

  const isPointCollidingWithRect = useCallback((point, rect) => {
    'worklet';
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  }, []);

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
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);
  const pipesSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);
  });

  const pipeWidth = 104;
  const pipeHeight = 640;

  const moveTheMap = useCallback(() => {
    if (startGame === false) {
      pipeX.value = withSequence(
        withTiming(width, {duration: 0}),
        withTiming(-150, {
          duration: 3000 / pipesSpeed.value,
          easing: Easing.linear,
        }),
        withTiming(width, {duration: 0}),
      );
    }
  }, [pipeX, pipesSpeed.value, startGame, width]);

  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  React.useEffect(() => {
    moveTheMap();
  }, [moveTheMap, startGame]);

  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX.x;

      // change offset for the position of the next gap
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        // cancelAnimation(pipeX);
        runOnJS(moveTheMap)();
      }

      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        // do something ✨
        // runOnJS(setScore)(score + 1);
      }
    },
  );

  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
        runOnJS(setGameOverValue)(true);
      }

      const center = {
        x: birdX.x + 24,
        y: birdY.value + 12,
      };

      const isColliding = obstacles.value.some(rect =>
        isPointCollidingWithRect(center, rect),
      );
      if (isColliding) {
        gameOver.value = true;
        runOnJS(setGameOverValue)(true);
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
    if (!dt || gameOver.value || startGame) {
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
    runOnJS(setGameOverValue)(false);
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  const startGameFunc = () => {
    'worklet';
    runOnJS(setStartGame)(false);
    runOnJS(moveTheMap)();
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (startGame) {
      startGameFunc();
    } else if (gameOver.value) {
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
            width={pipeWidth}
            height={pipeHeight}
            x={pipeX}
            y={bottomPipeY}
          />
          <Image
            image={pipeTop}
            width={pipeWidth}
            height={pipeHeight}
            x={pipeX}
            y={topPipeY}
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
          {gameOverValue && !startGame ? (
            <Image
              image={gameOverImage}
              width={192}
              height={42}
              x={(width - 192) / 2}
              y={height / 2 - 60}
            />
          ) : null}
          {startGame ? (
            <Image
              image={startGameImage}
              width={184}
              height={267}
              x={(width - 184) / 2}
              y={(height - 267) / 2}
            />
          ) : null}
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
