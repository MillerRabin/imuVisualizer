import { JSONFetchChannel } from "https://components.int-t.com/current/core/jsonFetchChannel/jsonFetchChannel.js";
import quaternion from "./quaternion.js"; 
import schema from "./schema.js";

class StatusSchema extends schema.Schema {
  statusRaw1 = 'uint32_t';
  statusRaw2 = 'uint32_t';
  parse(status) {
    return {
      online: true,
      canSendOK: !!(status.statusRaw1 & 1),
      shoulderOK: !!(status.statusRaw1 & 2),
      elbowOK: !!(status.statusRaw1 & 4),
      wristOK: !!(status.statusRaw1 & 8),
      clawOK: !!(status.statusRaw1 & 16),
      clawRangeOK: !!(status.statusRaw1 & 32),
      enginesEnabled: !!(status.statusRaw1 & 64),
      cameraEnabled: !!(status.statusRaw1 & 128),
    }
  }
};

const armSchema = {
  arm: new StatusSchema(),
  platform: {
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema(),
    barometer: new schema.BarometerSchema()
  }, 
  shoulder: {
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  elbow: {
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  wrist: {
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  claw: {
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.WitmotionAccelerometerSchema(),
    gyroscope: new schema.WitmotionGyroscopeSchema(),
    range: new schema.RangeSchema(),
    barometer: new schema.BarometerSchema(),
  },
  error: null
};

class ArmChannel extends JSONFetchChannel {
  #armIP = '192.168.1.120';
  #onupdate = null;
  #reconnectTimer = null;
  #reconnectDelay = 1000;
 
  get onupdate() {
    return this.#onupdate;
  }

  set onupdate(value) {
    this.#onupdate = value;
  }

  #openSocket() {
    const ws = new WebSocket(`ws://${this.#armIP}/ws`);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      console.log('WebSocket connection established');
    }

    ws.onmessage = (event) => {
      const res = schema.parse(event.data, armSchema);      
      this.#onupdate?.(res);
    }

    ws.onclose = (e) => {
      console.warn("WebSocket closed", e.code, e.reason);
      this.#scheduleReconnect();
    };

    ws.onerror = (e) => {      
      ws.close();
    };
  }

  #scheduleReconnect() {    
    if (this.#reconnectTimer) return;

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      this.#openSocket();
      this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, 10000);
    }, this.#reconnectDelay);
  }
    constructor() {
    super();
    this.#openSocket();
  }
  
}

export const armChannel = new ArmChannel();


export default armChannel;