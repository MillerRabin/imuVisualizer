function qToFloat(fixedPointValue, qPoint) {
  let qFloat = fixedPointValue;
  qFloat *= Math.pow(2, qPoint * -1);
  return qFloat;
}

const types = {  
  'int8_t': (v, o) => [v.getInt8(o, true), o + 1],
  'uint8_t': (v, o) => [v.getUint8(o, true), o + 1],
  'uint16_t': (v, o) => [v.getUint16(o, true), o + 2],
  'int16_t': (v, o) => [v.getInt16(o, true), o + 2],
  'uint32_t': (v, o) => [v.getUint32(o, true), o + 4],
  'int32_t': (v, o) => [v.getInt32(o, true), o + 4]
};

class Schema {};

class QuaternionSchema extends Schema {
  rawI = 'int16_t';
  rawJ = 'int16_t';
  rawK = 'int16_t';
  rawReal = 'int16_t';
  q = 14;    
  parse(result) {
    const real = qToFloat(result.rawReal, this.q);          
    const i = qToFloat(result.rawI, this.q);        
    const j = qToFloat(result.rawJ, this.q);
    const k = qToFloat(result.rawK, this.q);    
    return { real, i, j, k };
  }
};

class AccelerometerSchema extends Schema {  
  rawX = 'int16_t';
  rawY = 'int16_t';
  rawZ = 'int16_t';
  notused = 'int16_t';
  q = 8;
  parse(result) {    
    const x = qToFloat(result.rawX, this.q);
    const y = qToFloat(result.rawY, this.q);
    const z = qToFloat(result.rawZ, this.q);
    return { x, y, z };
  }
};

class WitmotionAccelerometerSchema extends Schema {
  rawX = 'int16_t';
  rawY = 'int16_t';
  rawZ = 'int16_t';
  notused = 'int16_t';
  parse(result) {
    const x = result.rawX / 32768.0 * 16.0 * 9.80665;
    const y = result.rawY / 32768.0 * 16.0 * 9.80665;
    const z = result.rawZ / 32768.0 * 16.0 * 9.80665;
    return { x, y, z };
  }
};


class GyroscopeSchema extends Schema {
  rawX = 'int16_t';
  rawY = 'int16_t';
  rawZ = 'int16_t';
  notused = 'int16_t';
  q = 9;
  parse(result) {
    const x = qToFloat(result.rawX, this.q);
    const y = qToFloat(result.rawY, this.q);
    const z = qToFloat(result.rawZ, this.q);
    return { x, y, z };
  }
};

class WitmotionGyroscopeSchema extends Schema {
  rawX = 'int16_t';
  rawY = 'int16_t';
  rawZ = 'int16_t';
  notused = 'int16_t';
  q = 9;
  parse(result) {
    const x = result.rawX / 32768.0 * 2000.0;
    const y = result.rawY / 32768.0 * 2000.0;
    const z = result.rawZ / 32768.0 * 2000.0;
    return { x, y, z };
  }
};

class AccuracySchema extends Schema {
  quaternionAccuracy = 'uint8_t';
  accelerometerAccuracy = 'uint8_t';  
  quaternionRadAccuracy = 'uint16_t';  
  gyroscopeAccuracy = 'uint8_t';  
  unused1 = 'uint8_t';
  unused2 = 'uint16_t';
};

class BarometerSchema extends Schema {  
  heightRaw = 'int32_t';
  temperatureRaw = 'int16_t';
  unused = 'int16_t'
  parse(result) {    
    return { height: result.heightRaw / 100, temperature: result.temperatureRaw / 100 };
  }
};

class RangeSchema extends Schema {
  range = 'uint16_t';
  measureType = 'uint8_t';
  unused1 = 'uint8_t';
  unused2 = 'uint32_t';
  parse(result) {
    return { range: result.range, measureType: result.measureType };
  }
};


function parse(buffer, schema) {  
  const view = new DataView(buffer);
  const res = parseStruct(view, 0, schema);
  return res[0];
}


function parseStruct(view, offset, schema) {
  const keys = Object.keys(schema);
  const result = {};

  for (const key of keys) {
    const val = schema[key];
    if (val == null) {
      result[key] = val;
      continue;
    }

    const tval = typeof val;    
    if (tval == 'object') {
      [result[key], offset] = parseStruct(view, offset, val);
      continue;
    }

    if (tval == 'string' && val in types) {
      [result[key], offset] = types[val](view, offset);
      continue;
    }

    result[key] = val;
  }

  if (schema.parse != null) {
    const rp = schema.parse(result);
    return [rp, offset];
  }    

  return [result, offset];
}

export default {
  Schema,
  QuaternionSchema,  
  AccelerometerSchema,
  WitmotionAccelerometerSchema,
  WitmotionGyroscopeSchema,
  GyroscopeSchema,
  AccuracySchema,
  BarometerSchema,
  RangeSchema,    
  parse
}