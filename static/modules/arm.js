const gStatus = {
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
  },
  error: null
};

const expr = {
  status: gStatus,
  onupdate: null
}


async function getStatus() {
  const res = await fetch('http://192.168.1.120/status', {
    method: 'POST',
    signal: AbortSignal.timeout(500),
    headers: {
      'Content-Type': 'Application/JSON'
    },
    body: JSON.stringify({})
  });
  
  const text = await res.text();
  if (!res.ok) {    
    throw new Error(text);        
  }
  const obj = JSON.parse(text);      
  gStatus.shoulder.i = obj.shoulder.i;
  gStatus.shoulder.j = obj.shoulder.j;
  gStatus.shoulder.k = obj.shoulder.k;
  gStatus.shoulder.real = obj.shoulder.real;
  gStatus.shoulder.quaternionAccuracy = obj.shoulder.quaternionAccuracy;
  
  gStatus.elbow.i = obj.elbow.i;
  gStatus.elbow.j = obj.elbow.j;
  gStatus.elbow.k = obj.elbow.k;
  gStatus.elbow.real = obj.elbow.real;
  gStatus.elbow.quaternionAccuracy = obj.elbow.quaternionAccuracy;
  
  gStatus.wrist.i = obj.wrist.i;
  gStatus.wrist.j = obj.wrist.j;
  gStatus.wrist.k = obj.wrist.k;
  gStatus.wrist.real = obj.wrist.real;
  gStatus.wrist.quaternionAccuracy = obj.wrist.quaternionAccuracy;
    
  gStatus.platform.i = obj.platform.i;
  gStatus.platform.j = obj.platform.j;
  gStatus.platform.k = obj.platform.k;
  gStatus.platform.real = obj.platform.real;      
  gStatus.platform.quaternionAccuracy = obj.platform.quaternionAccuracy;  

  gStatus.arm.online = true;
  gStatus.arm.canSendOK = obj.status.canSendOK;
  gStatus.arm.shoulderOK = obj.status.shoulderOK;
  gStatus.arm.elbowOK = obj.status.elbowOK;
  gStatus.arm.wristOK = obj.status.wristOK;
  gStatus.arm.clawOK = obj.status.clawOK;
  gStatus.arm.clawRangeOK = obj.status.clawRangeOK;
  
  gStatus.claw.distance = obj.claw.distance;
  gStatus.claw.distanceType = obj.claw.distanceMeasureType;
  expr.onupdate?.(gStatus);
}
  
async function loopStatus() {
  try {
    await getStatus();    
  } catch (e) {  
    gStatus.arm.online = false;    
    gStatus.error = e.message;
    expr.onupdate?.(gStatus);
  }
      
  setTimeout(function() {
    loopStatus();
  }, 100);
}
  
loopStatus();

export default expr;