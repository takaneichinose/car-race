"use strict";

import * as Constants from "../classes/constants";
import * as Enums from "../classes/enums";
import * as Interfaces from "../classes/interfaces";

let lastAcceleratedTime: number = 0;
let lastIncreasedDistance: number = 0;
let lastSpawnedTime: number = 0;
let velocity: number = Constants.INITIAL_SPEED;
let activeKeys: Interfaces.ActiveKeys = {
  left: false,
  right: false
};

function random(min: number, max: number) {
  return Math.round(Math.random() * (max - min)) + min;
}

export function preload(vueObj: Interfaces.CarRaceData): void {
  let assets = Constants.ASSETS;

  vueObj.assetsCount = assets.length;

  setTimeout(() => {
    for (let i = 0; i < vueObj.assetsCount; i++) {
      let img = new Image();

      img.src = assets[i];
      img.onload = function(evt) {
        loadingProcess(vueObj);
      }
    }
  }, Constants.PRELOAD_WAITTIME);
}

export function initialize(vueObj: Interfaces.CarRaceData): void {
  if (vueObj.screen.active === null) {
    setActive(vueObj, Enums.Screen.Loading);
  }
  else {
    setActive(vueObj, Enums.Screen.Front);
  }

  velocity = Constants.INITIAL_SPEED

  vueObj.car.left = (Constants.SCREEN_WIDTH / 2) - (Constants.CAR_WIDTH / 2);
  vueObj.car.rotate = 0;
  vueObj.computer.cars = new Array<Interfaces.CarRaceCar>();
  vueObj.distanceTraveled = 0;
}

export function events(vueObj: Interfaces.CarRaceData, key: Enums.Keys, mode: Enums.KeyMode): void {
  switch (vueObj.screen.active) {
    case Enums.Screen.Front:
      frontEvent(vueObj, key, mode);

      return;
    case Enums.Screen.Instructions:
      instructionsEvent(vueObj, key, mode);

      return;
    case Enums.Screen.Game:
      gameEvent(key, mode);

      return;
  }
}

export function beginGame(vueObj: Interfaces.CarRaceData): void {
  lastAcceleratedTime = performance.now();
  lastIncreasedDistance = performance.now();
  lastSpawnedTime = performance.now();

  gameLoop(vueObj);
}

function loadingProcess(vueObj: Interfaces.CarRaceData): void {
  vueObj.assetsLoaded++;

  vueObj.loadingProgress = vueObj.assetsLoaded / vueObj.assetsCount * 100;

  if (vueObj.loadingProgress >= 100) {
    // HACK: To be able to see "100% loaded status"
    setTimeout(function() {
      setActive(vueObj, Enums.Screen.Front);
    }, 1);
  }
}

function setActive(vueObj: Interfaces.CarRaceData, active: Enums.Screen): void {
  vueObj.screen.active = active;
  vueObj.screen.name = Enums.Screen[active];
}

function frontEvent(vueObj: Interfaces.CarRaceData, key: Enums.Keys, mode: Enums.KeyMode): void {
  if (key === Enums.Keys.Space && mode === Enums.KeyMode.Down) {
    setActive(vueObj, Enums.Screen.Instructions);
  }
}

function instructionsEvent(vueObj: Interfaces.CarRaceData, key: Enums.Keys, mode: Enums.KeyMode): void {
  if (key === Enums.Keys.Space && mode === Enums.KeyMode.Down) {
    setActive(vueObj, Enums.Screen.Game);
  }
}

function gameEvent(key: Enums.Keys, mode: Enums.KeyMode): void {
  let active: boolean = true;

  if (mode === Enums.KeyMode.Up) {
    active = false;
  }

  switch (key) {
    case Enums.Keys.Left:
      activeKeys.left = active;

      return;
    case Enums.Keys.Right:
      activeKeys.right = active;

      return;
  }
}

function gameLoop(vueObj: Interfaces.CarRaceData): void {
  window.requestAnimationFrame(() => gameLoop(vueObj));

  update(vueObj);

  // Supposed to be, I have rendering logic here.
  // But rendering is already done by Vue template,
  // so I removed it.
}

function moveDirection(vueObj: Interfaces.CarRaceData): void {
  if (
    // If left arrow key is pressed
    activeKeys.left === true &&
    // If the left position of car is greater than the left gutter
    vueObj.car.left - Constants.MOVE_SPEED >= Constants.COLLISION_LEFT
  ) {
    vueObj.car.left -= Constants.MOVE_SPEED;
  }

  if (
    // If right arrow key is pressed
    activeKeys.right === true &&
    // If the left position (+width) of car is greated than the right gutter
    vueObj.car.left + Constants.MOVE_SPEED <= Constants.COLLISION_RIGHT
  ) {
    vueObj.car.left += Constants.MOVE_SPEED;
  }

  if (
    (activeKeys.left === true && activeKeys.right === true) ||
    (activeKeys.left === false && activeKeys.right === false)
  ) {
    vueObj.car.rotate = 0;
  }
  else if (activeKeys.left === true) {
    vueObj.car.rotate = -Constants.TURN_ANGLE;
  }
  else if (activeKeys.right === true) {
    vueObj.car.rotate = Constants.TURN_ANGLE;
  }
}

function update(vueObj: Interfaces.CarRaceData): void {
  // console.log(vueObj.distanceTraveled);

  accelarate(vueObj);
  moveDirection(vueObj);
  spawnComputerCar(vueObj);
  // TODO: Update compuer car position
}

function accelarate(vueObj: Interfaces.CarRaceData): void {
  if (performance.now() - lastIncreasedDistance > Constants.INCREASE_DISTANCE_TIME) {
    vueObj.distanceTraveled += velocity;

    lastIncreasedDistance = performance.now();
  }

  if (velocity >= Constants.TOP_SPEED) {
    return;
  }

  if (performance.now() - lastAcceleratedTime > Constants.ACCELERATION_TIME) {
    velocity += Constants.ACCELERATION;

    lastAcceleratedTime = performance.now();
  }
}

function randomCarLane(): number {
  let lane = random(0, 2);

  switch (lane) {
    case 0:
      return Constants.CAR_LANE_1;
    case 1:
      return Constants.CAR_LANE_2;
    case 2:
      return Constants.CAR_LANE_3;
  }

  return 0;
}

function spawnComputerCar(vueObj: Interfaces.CarRaceData): void {
  if (performance.now() - lastSpawnedTime >= Constants.SPAWN_TIME) {
    vueObj.computer.cars.push({
      width: Constants.CAR_WIDTH,
      height: Constants.CAR_HEIGHT,
      top: -Constants.CAR_HEIGHT,
      left: randomCarLane(),
      rotate: 0
    } as Interfaces.CarRaceCar);

    lastSpawnedTime = performance.now();
  }
}
