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
let gPlatform = null;
let gShoulder = null;
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
    requestAnimationFrame( animate );  
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
    renderer.render( scene, camera );
  }
    
  const application = window.document.querySelector('.application');
  gComponents = application.components;
  const ratio = gComponents.renderer.clientWidth / gComponents.renderer.clientHeight;    

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);  
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

  gComponents.renderer.appendChild(renderer.domElement);
  //gComponents.grid.setRow(1, 'height', 'auto');
  
  const platform = createCube(materials, { x: 0, y: 0, z: 0 });
  const shoulder = createCube(materials, { x: 2, y: 0, z: 0 });  
  const elbow = createCube(materials, { x: 4, y: 0, z: 0 });
  const wrist = createCube(materials, { x: 6, y: 0, z: 0 });  
  const claw = createCube(materials, { x: 8, y: 0, z: 0 });
    
  scene.add(platform);
  scene.add(shoulder);
  scene.add(elbow);
  scene.add(wrist);
  scene.add(claw);

  camera.rotation.x = THREE.MathUtils.degToRad(-90);
  camera.position.x = 5;
  camera.position.y = 5;
  camera.position.z = 0;
  animate();
}

const gOffsets = { 
  platform: {
    offset: { i: 0, j: 0, k: 0, real: 1 },
  },
  shoulder: {
    offset: { i: 0, j: 0, k: 0, real: 1 },    
    yZero: 0,
    yStep: -1,    
    zZero: 135,
    zStep: 1
  }
};

function norm(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function rotateVectorByQuat(q, v) {
  const qv = { real: 0, i: v.x, j: v.y, k: v.z };
  const tmp = quaternion.multiply(q, qv);
  const qr = quaternion.multiply(tmp, quaternion.invert(q));
  return { x: qr.i, y: qr.j, z: qr.k };
}

function extractTwistAngleAroundAxis(q, axis) {
  // vector part
  const v = { x: q.i, y: q.j, z: q.k };
  // проекция вектора v на axis
  const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z;
  const proj = { x: axis.x * dot, y: axis.y * dot, z: axis.z * dot };

  // Если проекция почти нулевая и w ~ 1 -> угол ~ 0
  const projNorm = norm(proj);
  if (projNorm < 1e-12) return 0.0;

  // собрать q_tw = (w, proj)
  let w = q.real;
  let qtw = { w: w, x: proj.x, y: proj.y, z: proj.z };

  // нормализация
  const mag = Math.sqrt(qtw.w * qtw.w + projNorm * projNorm);
  qtw.w /= mag;
  qtw.x = qtw.x / mag;
  qtw.y = qtw.y / mag;
  qtw.z = qtw.z / mag;

  // угол: 2 * atan2(||proj||, w) — более устойчиво чем acos
  const angle = 2.0 * Math.atan2(projNorm / mag, qtw.w); // projNorm/mag == sin(theta/2)

  // задаём знак по скалярному произведению (v·axis)
  const sign = (dot >= 0) ? 1.0 : -1.0;
  return sign * angle; // радианы
}

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
  gOffsets.platform.offset = { i: status.platform.i, j: status.platform.j, k: status.platform.k, real: status.platform.real };
  gOffsets.shoulder.offset = quaternion.multiply(gOffsets.platform.offset, quaternion.invert(status.shoulder));
}


function normalize(v) {
  const n = norm(v);
  if (n < 1e-12) return { x: 0, y: 0, z: 0 };
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

function getServoAngle(twistAngle) {
  let deg = twistAngle * (180 / Math.PI);
  if (deg > 270 ) deg = deg - 360;
  
  return -1 * deg;
}

async function armCallback(status) {
  if (gComponents == null) return;
  
  gComponents.error.message = '';
    
  if (quaternion.isOne(gOffsets.platform.offset) && (quaternion.isValid(status.platform.quaternion))) {
    //saveOffsets(status);
    loadOffsets();
  }

  const so = quaternion.multiply(gOffsets.shoulder.offset, status.shoulder.quaternion);
  
  const pDiff = quaternion.multiply(quaternion.invert(gOffsets.platform.offset), status.platform.quaternion);
  const sDiff = quaternion.multiply(quaternion.invert(gOffsets.platform.offset), so);

  const pdEuler = euler.get(pDiff.i, pDiff.j, pDiff.k, pDiff.real);
  const sdEuler = euler.get(sDiff.i, sDiff.j, sDiff.k, sDiff.real);
  
  gComponents.platform.difference.roll = (pdEuler.x * (180 / Math.PI)).toFixed(3);
  gComponents.platform.difference.pitch = (pdEuler.y * (180 / Math.PI)).toFixed(3);
  gComponents.platform.difference.yaw = (pdEuler.z * (180 / Math.PI)).toFixed(3);
    
  gComponents.shoulder.difference.roll = sdEuler.x * (180 / Math.PI);
  gComponents.shoulder.difference.pitch = sdEuler.y * (180 / Math.PI);
  gComponents.shoulder.difference.yaw = sdEuler.z * (180 / Math.PI);
  
    
  const localY = { x: 0, y: 0, z: 1 };  
  const axisY_in_platform = rotateVectorByQuat(gOffsets.platform.offset, localY);
  const axisUnit = normalize(axisY_in_platform);
  
  const ra = extractTwistAngleAroundAxis(sDiff, axisUnit);
  gComponents.shoulder.y.value = getServoAngle(ra);

  /*const sr = quaternion.fromEuler(
    gComponents.shoulder.rotate.roll * (Math.PI / 180),
    gComponents.shoulder.rotate.pitch * (Math.PI / 180),
    gComponents.shoulder.rotate.yaw * (Math.PI / 180)
  );
  so = quaternion.multiply(sr, so);*/
  
  gComponents.shoulder.z.value = (sdEuler.x + pdEuler.z) * (180 / Math.PI) + 135 ;
    
  const poQuat = new THREE.Quaternion(status.platform.quaternion.i, status.platform.quaternion.j, status.platform.quaternion.k, status.platform.quaternion.real);
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
  
  const soQuat = new THREE.Quaternion(so.i, so.j, so.k, so.real);  
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

  const eEuler = new THREE.Euler().setFromQuaternion(woQuat);
  gComponents.elbow.euler.roll = eEuler.x * (180 / Math.PI);
  gComponents.elbow.euler.pitch = eEuler.y * (180 / Math.PI);
  gComponents.elbow.euler.yaw = eEuler.z * (180 / Math.PI);

  gComponents.wrist.quaternion.i = woQuat.x;
  gComponents.wrist.quaternion.j = woQuat.y;
  gComponents.wrist.quaternion.k = woQuat.z;
  gComponents.wrist.quaternion.real = woQuat.w;
  gComponents.wrist.accuracy.value = status.wrist.accuracy.quaternionAccuracy;
  gComponents.wrist.online.value = status.arm.wristOK;
  
  const wEuler = new THREE.Euler().setFromQuaternion(eoQuat);
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

  gComponents.claw.distance.value = status.claw.range.range;
  gComponents.claw.distanceType.value = status.claw.range.measureType;

  gComponents.claw.accelerometer.x = status.claw.accelerometer.x;
  gComponents.claw.accelerometer.y = status.claw.accelerometer.y;
  gComponents.claw.accelerometer.z = status.claw.accelerometer.z;

  gComponents.claw.gyroscope.x = status.claw.gyroscope?.x ?? NaN;
  gComponents.claw.gyroscope.y = status.claw.gyroscope?.y ?? NaN;
  gComponents.claw.gyroscope.z = status.claw.gyroscope?.z ?? NaN;


    
  gPlatform = poQuat;
  gShoulder = soQuat;
  gElbow = eoQuat;
  gWrist = woQuat;
  gClaw = coQuat;
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
}

customElements.define('imu-application', IMUApplication);
