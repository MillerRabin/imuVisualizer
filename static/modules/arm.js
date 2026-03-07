import { JSONFetchChannel } from "https://components.int-t.com/current/core/jsonFetchChannel/jsonFetchChannel.js";
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
  tag: 'uint8_t',
  arm: new StatusSchema(),
  platform: {
    tag: 'uint8_t',
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),    
    barometer: new schema.BarometerSchema(),
    detectorsLinePower: new schema.PowerSchema(),
    cpuLinePower: new schema.PowerSchema(),
    enginesLinePower: new schema.PowerSchema(),
    unused1: 'uint16_t',
    unused2: 'uint16_t',
  }, 
  shoulder: {
    tag: 'uint8_t',
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  elbow: {
    tag: 'uint8_t',
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  wrist: {
    tag: 'uint8_t',
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.AccelerometerSchema(),
    gyroscope: new schema.GyroscopeSchema(),
    accuracy: new schema.AccuracySchema()
  },
  claw: {
    tag: 'uint8_t',
    quaternion: new schema.QuaternionSchema(),
    accelerometer: new schema.WitmotionAccelerometerSchema(),
    gyroscope: new schema.WitmotionGyroscopeSchema(),
    range: new schema.RangeSchema(),
    barometer: new schema.BarometerSchema(),
  },
  parse: (result) => {
    if (result.tag !== 0x01) {
      throw new Error(`Invalid Socket Response tag: ${result.tag} must be 0x01`);
    }
    if (result.platform.tag !== 0x02) {
      throw new Error(`Invalid Platform tag: ${result.platform.tag} must be 0x02`);
    }
    if (result.shoulder.tag !== 0x03) {
      throw new Error(`Invalid Shoulder tag: ${result.shoulder.tag} must be 0x03`);
    }
    if (result.elbow.tag !== 0x04) {
      throw new Error(`Invalid Elbow tag: ${result.elbow.tag} must be 0x04`);
    }
    if (result.wrist.tag !== 0x05) {
      throw new Error(`Invalid Wrist tag: ${result.wrist.tag} must be 0x05`);
    }
    if (result.claw.tag !== 0x06) {
      throw new Error(`Invalid Claw tag: ${result.claw.tag} must be 0x06`);
    }
    return result;
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

  async set(data) {
    this.url = `http://${this.#armIP}/set`;
    this.signal = AbortSignal.timeout(500);
    return await super.send(data);
  }
  
  constructor() {
    super();
    this.#openSocket();
  }
  
}

export const armChannel = new ArmChannel();


export default armChannel;