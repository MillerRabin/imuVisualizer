import { JSONFetchChannel } from "https://components.int-t.com/current/core/jsonFetchChannel/jsonFetchChannel.js";

class ArmChannel extends JSONFetchChannel {
  #armIP = '192.168.1.120';
  #onupdate = null;
  #status = {
    shoulder: {
      i: NaN,
      j: NaN,
      k: NaN,
      real: NaN,
      quaternionAccuracy: NaN
    },
    elbow: {
      i: NaN,
      j: NaN,
      k: NaN,
      real: NaN,
      quaternionAccuracy: NaN
    },
    wrist: {
      i: NaN,
      j: NaN,
      k: NaN,
      real: NaN,
      quaternionAccuracy: NaN
    },
    claw: {
      i: NaN,
      j: NaN,
      k: NaN,
      real: NaN,
      distance: NaN,
      distanceType: NaN
    },
    platform: {
      i: NaN,
      j: NaN,
      k: NaN,
      real: NaN,
      quaternionAccuracy: NaN
    },
    arm: {
      online: false,
      canSendOK: false,
      shoulderOK: false,
      elbowOK: false,
      wristOK: false,
      clawOK: false,
      clawRangeOK: false,
      engines: false,
      camera: false
    },
    error: null
  };

  get onupdate() {
    return this.#onupdate;
  }

  set onupdate(value) {
    this.#onupdate = value;
  }
  
  async #getStatus() {        
    this.url = `http://${this.#armIP}/status`;
    this.signal = AbortSignal.timeout(500);
    const obj = await super.send({});
    this.#status.shoulder.i = obj.shoulder.i;
    this.#status.shoulder.j = obj.shoulder.j;
    this.#status.shoulder.k = obj.shoulder.k;
    this.#status.shoulder.real = obj.shoulder.real;
    this.#status.shoulder.quaternionAccuracy = obj.shoulder.quaternionAccuracy;

    this.#status.elbow.i = obj.elbow.i;
    this.#status.elbow.j = obj.elbow.j;
    this.#status.elbow.k = obj.elbow.k;
    this.#status.elbow.real = obj.elbow.real;
    this.#status.elbow.quaternionAccuracy = obj.elbow.quaternionAccuracy;

    this.#status.wrist.i = obj.wrist.i;
    this.#status.wrist.j = obj.wrist.j;
    this.#status.wrist.k = obj.wrist.k;
    this.#status.wrist.real = obj.wrist.real;
    this.#status.wrist.quaternionAccuracy = obj.wrist.quaternionAccuracy;

    this.#status.platform.i = obj.platform.i;
    this.#status.platform.j = obj.platform.j;
    this.#status.platform.k = obj.platform.k;
    this.#status.platform.real = obj.platform.real;
    this.#status.platform.quaternionAccuracy = obj.platform.quaternionAccuracy;

    this.#status.arm.online = true;
    this.#status.arm.canSendOK = obj.status.canSendOK;
    this.#status.arm.shoulderOK = obj.status.shoulderOK;
    this.#status.arm.elbowOK = obj.status.elbowOK;
    this.#status.arm.wristOK = obj.status.wristOK;
    this.#status.arm.clawOK = obj.status.clawOK;
    this.#status.arm.clawRangeOK = obj.status.clawRangeOK;

    this.#status.claw.i = obj.claw.i;
    this.#status.claw.j = obj.claw.j;
    this.#status.claw.k = obj.claw.k;
    this.#status.claw.real = obj.claw.real;
    this.#status.claw.distance = obj.claw.distance;
    this.#status.claw.distanceType = obj.claw.distanceMeasureType;

    this.#status.arm.enginesEnabled = obj.powerManagement.enginesEnabled;
    this.#status.arm.cameraEnabled = obj.powerManagement.cameraEnabled;    
  }

  async set(data) {
    this.url = `http://${this.#armIP}/set`;
    this.signal = AbortSignal.timeout(500);
    return await super.send(data);
  }

  constructor() {
    super();
    this.#loopStatus();
  }

  #loopStatus= async () => {
    try {
      await this.#getStatus();      
    } catch (e) {
      this.#status.arm.online = false;
      this.#status.arm.canSendOK = false;
      this.#status.arm.shoulderOK = false;
      this.#status.arm.elbowOK = false;
      this.#status.arm.wristOK = false;
      this.#status.arm.clawOK = false;
      this.#status.arm.clawRangeOK = false;
      this.#status.arm.enginesEnabled = false;
      this.#status.arm.cameraEnabled = false;
      this.#status.error = e.message;    
    }
    await this.#onupdate?.(this.#status);
    setTimeout(() => {
      this.#loopStatus();
    }, 100);
  }
}

export const armChannel = new ArmChannel();

export default armChannel;