import * as THREE from 'three';
import arm from './modules/arm.js';
import { Application } from 'https://components.int-t.com/current/core/application/application.js';
import 'https://components.int-t.com/current/components/euler/euler.js';
import 'https://components.int-t.com/current/components/quaternion/quaternion.js';
import 'https://components.int-t.com/current/components/floatValue/floatValue.js';
import 'https://components.int-t.com/current/components/led/led.js';
import 'https://components.int-t.com/current/components/flexPanel/flexPanel.js';
import 'https://components.int-t.com/current/components/errorMessage/errorMessage.js';
import 'https://components.int-t.com/current/components/title/title.js';
import 'https://components.int-t.com/current/components/gridPanel/gridPanel.js';
import 'https://components.int-t.com/current/components/toggleButton/toggleButton.js';
import 'https://components.int-t.com/current/components/vector3d/vector3d.js';
import euler from './modules/euler.js';
import quaternion from './modules/quaternion.js';

arm.onupdate = armCallback;

let gComponents = null;
let gPlatform = { x: 0, y: 0, z: 0, w: 1 };
let gShoulder = { x: 0, y: 0, z: 0, w: 1 };
let gElbow = null;
let gWrist = null;
let gClaw = null;

function createCube(materials, position) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cube = new THREE.Mesh(geometry, materials);
  cube.position.x = position.x;
  cube.position.y = position.y;
  cube.position.z = position.z;
  return cube;
}

function ready() {
  function animate() {
    requestAnimationFrame(animate);
    if (gPlatform != null)
      platform.setRotationFromQuaternion(gPlatform);
    if (gShoulder != null)
      shoulder.setRotationFromQuaternion(gShoulder);
    if (gElbow != null)
      elbow.setRotationFromQuaternion(gElbow);
    if (gWrist != null)
      wrist.setRotationFromQuaternion(gWrist);
    if (gClaw != null)
      claw.setRotationFromQuaternion(gClaw);
    renderer.render(scene, camera);
  }

  const application = window.document.querySelector('.application');
  gComponents = application.components;


  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer();
  const loader = new THREE.TextureLoader();

  const image1 = loader.load('/images/1.png');
  const image2 = loader.load('/images/2.png');
  const image3 = loader.load('/images/3.png');
  const image4 = loader.load('/images/4.png');
  const image5 = loader.load('/images/5.png');
  const image6 = loader.load('/images/6.png');

  const materials = [
    new THREE.MeshBasicMaterial({ map: image1 }),
    new THREE.MeshBasicMaterial({ map: image2 }),
    new THREE.MeshBasicMaterial({ map: image3 }),
    new THREE.MeshBasicMaterial({ map: image4 }),
    new THREE.MeshBasicMaterial({ map: image5 }),
    new THREE.MeshBasicMaterial({ map: image6 })
  ];

  renderer.setSize(gComponents.renderer.clientWidth, gComponents.renderer.clientHeight);
  const aspect = gComponents.renderer.clientWidth / gComponents.renderer.clientHeight;

  const zoom = 3;
  const camera = new THREE.OrthographicCamera(
    -zoom * aspect, zoom * aspect,
    zoom, -zoom,
    0.1, 100
  );

  gComponents.renderer.appendChild(renderer.domElement);

  const platform = createCube(materials, { x: 0, y: 0, z: 8 });
  const shoulder = createCube(materials, { x: 0, y: 0, z: 6 });
  const elbow = createCube(materials, { x: 0, y: 0, z: 4 });
  const wrist = createCube(materials, { x: 0, y: 0, z: 2 });
  const claw = createCube(materials, { x: 0, y: 0, z: 0 });

  scene.add(platform);
  scene.add(shoulder);
  scene.add(elbow);
  scene.add(wrist);
  scene.add(claw);

  camera.position.set(10, 0, 4);
  camera.lookAt(0, 0, 4);

  animate();
}

const gOffsets = {
  platform: {
    offset: { i: 0, j: 0, k: 0, real: 1 },    
  },
  shoulder: {
    offset: { i: 0, j: 0, k: 0, real: 1 }   
  }
};

function loadOffsets() {
  if (window.localStorage['offsets'] != null) {
    const offsets = JSON.parse(window.localStorage['offsets']);
    Object.assign(gOffsets, offsets);
  }
}

function saveOffsets(status) {
  calcOffsets(status);
  window.localStorage['offsets'] = JSON.stringify(gOffsets);
}

function calcOffsets(status) {
  gOffsets.platform.offset = { i: status.platform.quaternion.i, j: status.platform.quaternion.j, k: status.platform.quaternion.k, real: status.platform.quaternion.real };  
  gOffsets.shoulder.offset = quaternion.multiply(quaternion.invert(gOffsets.platform.offset), status.shoulder.quaternion);  
}

function swingTwistDecomposition(q, axis) {
  const v = { x: q.i, y: q.j, z: q.k };  
  const dot =
    v.x * axis.x +
    v.y * axis.y +
    v.z * axis.z;

  const twist = {
    real: q.real,
    i: axis.x * dot,
    j: axis.y * dot,
    k: axis.z * dot
  };
  
  const len = Math.hypot(twist.real, twist.i, twist.j, twist.k);
  twist.real /= len;
  twist.i /= len;
  twist.j /= len;
  twist.k /= len;

  const swing = quaternion.multiply(q, quaternion.invert(twist));
  return { swing, twist };
}

function twistAngle(qTwist) {  
  const angle = 2 * Math.acos(Math.max(-1, Math.min(1, qTwist.real)));
  const sign = (qTwist.i + qTwist.j + qTwist.k) >= 0 ? 1 : -1;
  return angle * sign;
}

function normalizeAngleDeg(a) {
  a = (a + 180) % 360;
  if (a < 0) a += 360;
  return a - 180;
}

let needSaveState = false;
let printState = false;

function getDifference(platformQ, shoulderQ, shoulderOffset) {
  const AXIS_X_LOCAL = { x: 1, y: 0, z: 0 };
  const AXIS_Y_LOCAL = { x: 0, y: 1, z: 0 };
  const AXIS_Z_LOCAL = { x: 0, y: 0, z: 1 };

  const qShoulderRelNow = quaternion.multiply(quaternion.invert(platformQ), shoulderQ);
  const sDiff = quaternion.multiply(quaternion.invert(shoulderOffset), qShoulderRelNow);

  const { twist: yawQ } = swingTwistDecomposition(sDiff, AXIS_X_LOCAL);
  const yaw = twistAngle(yawQ);
  const { twist: pitchQ } = swingTwistDecomposition(sDiff, AXIS_Y_LOCAL);
  const pitch = twistAngle(pitchQ);
  const { twist: rollQ } = swingTwistDecomposition(sDiff, AXIS_Z_LOCAL);
  const roll = twistAngle(rollQ);
  return { roll, pitch, yaw };
}

function tiltAngle(acc) {
  const { x, y, z } = acc;

  //const g = 9.80665;
  const g = 9.5;
  //const g = Math.sqrt(x * x + y * y + z * z);
  //const xnorm = x / Math.sqrt(x * x + y * y + z * z);
  

  if (g === 0) return 0;

  const sign = y >= -1 ? 1 : -1;

  const angleRad = Math.acos(x / g);
  if (isNaN(angleRad)) return 0;
  return sign * angleRad * 180 / Math.PI;
}

async function armCallback(status) {
  if (gComponents == null) return;

  gComponents.error.message = '';
  
  if (needSaveState) {
    saveOffsets(status);
    needSaveState = false;
  }

  if (printState) {    
    console.log('Platform Quaternion:', status.platform.quaternion);
    console.log('Shoulder Quaternion:', status.shoulder.quaternion);
    printState = false;
  }

  if (quaternion.isOne(gOffsets.platform.offset) && (quaternion.isValid(status.platform.quaternion))) {
    loadOffsets(status);
  }

  const pDiff = status.platform.quaternion;

  const poEuler = euler.get(status.platform.quaternion.i, status.platform.quaternion.j, status.platform.quaternion.k, status.platform.quaternion.real);
  const soEuler = euler.get(status.shoulder.quaternion.i, status.shoulder.quaternion.j, status.shoulder.quaternion.k, status.shoulder.quaternion.real);
  
  const pdEuler = euler.get(pDiff.i, pDiff.j, pDiff.k, pDiff.real);

  gComponents.platform.origin.roll = (poEuler.x * (180 / Math.PI)).toFixed(3);
  gComponents.platform.origin.pitch = (poEuler.y * (180 / Math.PI)).toFixed(3);
  gComponents.platform.origin.yaw = (poEuler.z * (180 / Math.PI)).toFixed(3);

  gComponents.platform.difference.roll = (pdEuler.x * (180 / Math.PI)).toFixed(3);
  gComponents.platform.difference.pitch = (pdEuler.y * (180 / Math.PI)).toFixed(3);
  gComponents.platform.difference.yaw = (pdEuler.z * (180 / Math.PI)).toFixed(3);

  gComponents.shoulder.origin.roll = soEuler.x * (180 / Math.PI);
  gComponents.shoulder.origin.pitch = soEuler.y * (180 / Math.PI);
  gComponents.shoulder.origin.yaw = soEuler.z * (180 / Math.PI);
  
  
  const diff = getDifference(status.platform.quaternion, status.shoulder.quaternion, gOffsets.shoulder.offset);

  gComponents.shoulder.x.value = normalizeAngleDeg(diff.roll * 180 / Math.PI);
  gComponents.shoulder.y.value = tiltAngle(status.shoulder.accelerometer);
  gComponents.shoulder.z.value = normalizeAngleDeg(diff.yaw * 180 / Math.PI);

  //const poQuat = new THREE.Quaternion(pDiff.i, pDiff.j, pDiff.k, pDiff.real);
  const poQuat = new THREE.Quaternion(status.platform.quaternion.i, status.platform.quaternion.j, status.platform.quaternion.k, status.platform.quaternion.real);
  const soQuat = new THREE.Quaternion(status.shoulder.quaternion.i, status.shoulder.quaternion.j, status.shoulder.quaternion.k, status.shoulder.quaternion.real);  
  const eoQuat = new THREE.Quaternion(status.elbow.quaternion.i, status.elbow.quaternion.j, status.elbow.quaternion.k, status.elbow.quaternion.real);
  const woQuat = new THREE.Quaternion(status.wrist.quaternion.i, status.wrist.quaternion.j, status.wrist.quaternion.k, status.wrist.quaternion.real);
  const coQuat = new THREE.Quaternion(status.claw.quaternion.i, status.claw.quaternion.j, status.claw.quaternion.k, status.claw.quaternion.real);

  gComponents.platform.quaternion.i = poQuat.x;
  gComponents.platform.quaternion.j = poQuat.y;
  gComponents.platform.quaternion.k = poQuat.z;
  gComponents.platform.quaternion.real = poQuat.w;

  gComponents.platform.accuracy.value = status.platform.accuracy.quaternionAccuracy;
  gComponents.platform.accelerometer.x = status.platform.accelerometer?.x ?? NaN;
  gComponents.platform.accelerometer.y = status.platform.accelerometer?.y ?? NaN;
  gComponents.platform.accelerometer.z = status.platform.accelerometer?.z ?? NaN;

  gComponents.platform.gyroscope.x = status.platform.gyroscope?.x ?? NaN;
  gComponents.platform.gyroscope.y = status.platform.gyroscope?.y ?? NaN;
  gComponents.platform.gyroscope.z = status.platform.gyroscope?.z ?? NaN;
  gComponents.platform.height.value = status.platform.barometer.height;
  gComponents.platform.temperature.value = status.platform.barometer.temperature;

  gComponents.platform.online.value = status.arm.online;
  gComponents.platform.canSending.value = status.arm.canSendOK;
  gComponents.platform.engines.value = status.arm.enginesEnabled;
  gComponents.platform.camera.value = status.arm.cameraEnabled;

  gComponents.platform.toggleEngines.value = status.arm.enginesEnabled;
  gComponents.platform.toggleCamera.value = status.arm.cameraEnabled;

  gComponents.shoulder.quaternion.i = soQuat.x;
  gComponents.shoulder.quaternion.j = soQuat.y;
  gComponents.shoulder.quaternion.k = soQuat.z;
  gComponents.shoulder.quaternion.real = soQuat.w;

  gComponents.shoulder.accuracy.value = status.shoulder.accuracy.quaternionAccuracy;
  gComponents.shoulder.online.value = status.arm.shoulderOK;

  gComponents.shoulder.accelerometer.x = status.shoulder.accelerometer?.x ?? NaN;
  gComponents.shoulder.accelerometer.y = status.shoulder.accelerometer?.y ?? NaN;
  gComponents.shoulder.accelerometer.z = status.shoulder.accelerometer?.z ?? NaN;

  gComponents.shoulder.gyroscope.x = status.shoulder.gyroscope?.x ?? NaN;
  gComponents.shoulder.gyroscope.y = status.shoulder.gyroscope?.y ?? NaN;
  gComponents.shoulder.gyroscope.z = status.shoulder.gyroscope?.z ?? NaN;

  gComponents.elbow.quaternion.i = eoQuat.x;
  gComponents.elbow.quaternion.j = eoQuat.y;
  gComponents.elbow.quaternion.k = eoQuat.z;
  gComponents.elbow.quaternion.real = eoQuat.w;
  gComponents.elbow.accuracy.value = status.elbow.accuracy.quaternionAccuracy;
  gComponents.elbow.online.value = status.arm.elbowOK;

  gComponents.elbow.accelerometer.x = status.elbow.accelerometer?.x ?? NaN;
  gComponents.elbow.accelerometer.y = status.elbow.accelerometer?.y ?? NaN;
  gComponents.elbow.accelerometer.z = status.elbow.accelerometer?.z ?? NaN;

  gComponents.elbow.gyroscope.x = status.elbow.gyroscope?.x ?? NaN;
  gComponents.elbow.gyroscope.y = status.elbow.gyroscope?.y ?? NaN;
  gComponents.elbow.gyroscope.z = status.elbow.gyroscope?.z ?? NaN;

  const eEuler = new THREE.Euler().setFromQuaternion(eoQuat);
  gComponents.elbow.euler.roll = eEuler.x * (180 / Math.PI);
  gComponents.elbow.euler.pitch = eEuler.y * (180 / Math.PI);
  gComponents.elbow.euler.yaw = eEuler.z * (180 / Math.PI);

  gComponents.wrist.quaternion.i = woQuat.x;
  gComponents.wrist.quaternion.j = woQuat.y;
  gComponents.wrist.quaternion.k = woQuat.z;
  gComponents.wrist.quaternion.real = woQuat.w;
  gComponents.wrist.accuracy.value = status.wrist.accuracy.quaternionAccuracy;
  gComponents.wrist.online.value = status.arm.wristOK;

  const wEuler = new THREE.Euler().setFromQuaternion(woQuat);
  gComponents.wrist.euler.roll = wEuler.x * (180 / Math.PI);
  gComponents.wrist.euler.pitch = wEuler.y * (180 / Math.PI);
  gComponents.wrist.euler.yaw = wEuler.z * (180 / Math.PI);

  gComponents.wrist.accelerometer.x = status.wrist.accelerometer?.x ?? NaN;
  gComponents.wrist.accelerometer.y = status.wrist.accelerometer?.y ?? NaN;
  gComponents.wrist.accelerometer.z = status.wrist.accelerometer?.z ?? NaN;

  gComponents.wrist.gyroscope.x = status.wrist.gyroscope?.x ?? NaN;
  gComponents.wrist.gyroscope.y = status.wrist.gyroscope?.y ?? NaN;
  gComponents.wrist.gyroscope.z = status.wrist.gyroscope?.z ?? NaN;

  gComponents.claw.quaternion.i = coQuat.x;
  gComponents.claw.quaternion.j = coQuat.y;
  gComponents.claw.quaternion.k = coQuat.z;
  gComponents.claw.quaternion.real = coQuat.w;
  gComponents.claw.online.value = status.arm.clawOK;

  const cEuler = new THREE.Euler().setFromQuaternion(coQuat);
  gComponents.claw.euler.roll = cEuler.x * (180 / Math.PI);
  gComponents.claw.euler.pitch = cEuler.y * (180 / Math.PI);
  gComponents.claw.euler.yaw = cEuler.z * (180 / Math.PI);

  gComponents.claw.long.value = status.claw.range.longRange;
  gComponents.claw.short.value = status.claw.range.shortRange;

  gComponents.claw.accelerometer.x = status.claw.accelerometer.x;
  gComponents.claw.accelerometer.y = status.claw.accelerometer.y;
  gComponents.claw.accelerometer.z = status.claw.accelerometer.z;

  gComponents.claw.gyroscope.x = status.claw.gyroscope?.x ?? NaN;
  gComponents.claw.gyroscope.y = status.claw.gyroscope?.y ?? NaN;
  gComponents.claw.gyroscope.z = status.claw.gyroscope?.z ?? NaN;

  gPlatform = poQuat.clone();  
  gShoulder = soQuat.clone();  
  gElbow = eoQuat.clone();
  gWrist = woQuat.clone();
  gClaw = coQuat.clone();
}

export class IMUApplication extends Application {
  componentReady() {
    ready();
  }

  toggleEngines(element) {
    arm.set({
      enginesEnabled: element.value
    });
  }

  toggleCamera(element) {
    arm.set({
      cameraEnabled: element.value
    });
  }

  saveOffsets() {
    needSaveState = true;
  }

  print() {
    printState = true;
  }
}

customElements.define('imu-application', IMUApplication);
