import euler from './euler.js';

const gStatus = {
  shoulder: {
    i: NaN,
    j: NaN,
    k: NaN,
    real: NaN,
    quaternionAccuracy: NaN
  },
  platform: {
    i: NaN,
    j: NaN,
    k: NaN,
    real: NaN,
    quaternionAccuracy: NaN
  },
  error: null
};

const expr = {
  status: gStatus,
  onupdate: null
}


async function getStatus() {
  const res = await fetch('http://192.168.1.70/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'Application/JSON'
    },
    body: JSON.stringify({})
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  const obj = JSON.parse(text);      
  gStatus.shoulder.i = obj.shoulder.i;
  gStatus.shoulder.j = obj.shoulder.j;
  gStatus.shoulder.k = obj.shoulder.k;
  gStatus.shoulder.real = obj.shoulder.real;
  gStatus.shoulder.quaternionAccuracy = obj.shoulder.quaternionAccuracy;
  gStatus.platform.i = obj.platform.i;
  gStatus.platform.j = obj.platform.j;
  gStatus.platform.k = obj.platform.k;
  gStatus.platform.real = obj.platform.real;      
  gStatus.platform.quaternionAccuracy = obj.platform.quaternionAccuracy;  
  expr.onupdate?.(gStatus);
}
  
async function loopStatus() {
  try {
    await getStatus();    
  } catch (e) {      
    gStatus.error = e.message;
    console.error(e);
  }
      
  setTimeout(function() {
    loopStatus();
  }, 100);
}
  
loopStatus();

export default expr;