function create(vector, angle) {
  const rVector = normal(vector)
  const real = Math.cos(angle / 2)
  const i = rVector.x * Math.sin(angle / 2);
  const j = rVector.y * Math.sin(angle / 2);
  const k = rVector.z * Math.sin(angle / 2);
  return { real, i, j, k };
}

function normal(vector) {  
  const length = Math.sqrt(vector.x ^ 2 + vector.y ^ 2 + vector.z ^ 2);
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
}

function multiply(a, b) {
  const real = a.real * b.real - a.i * b.i - a.j * b.j - a.k * b.k;
  const i = a.real * b.i + a.i * b.real + a.j * b.k - a.k * b.j;
  const j = a.real * b.j - a.i * b.k + a.j * b.real + a.k * b.i;
  const k = a.real * b.k + a.i * b.j - a.j * b.i + a.k * b.real;
  return { real, i, j, k };
}
 

function multiplyVector(a, v) {
  const real = -a.i * v.x - a.j * v.y - a.k * v.z;
  const i = a.real * v.x + a.j * v.z - a.k * v.y;
  const j = a.real * v.y - a.i * v.z + a.k * v.x;
  const k = a.real * v.z + a.i * v.y - a.j * v.x;
  return { i, j, k, real };
}

function transform(q, v) {
  t = multiplyVector(q, v)
  t = multiply(t, invert(q));
  
  quat_transform_vector.x = t.x
  quat_transform_vector.y = t.y
  quat_transform_vector.z = t.z

}
    
  
  

export default {
  create,
  multiply,
  multiplyVector
}