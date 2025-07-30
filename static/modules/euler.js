function get(i, j, k, real) {
  let dqw = real;
	let dqx = i;
	let dqy = j;
	let dqz = k;

	const norm = Math.sqrt(dqw*dqw + dqx*dqx + dqy*dqy + dqz*dqz);
	if (norm == 0) return {
		z: 0,
		y: 0,
		x: 0
	};

	dqw = dqw / norm;
	dqx = dqx / norm;
	dqy = dqy / norm;
	dqz = dqz / norm;

	const ysqr = dqy * dqy;
	
	const t3 = +2.0 * (dqw * dqz + dqx * dqy);
	const t4 = +1.0 - 2.0 * (ysqr + dqz * dqz);
	const z = Math.atan2(t3, t4);

	let t2 = +2.0 * (dqw * dqy - dqz * dqx);
	t2 = t2 > 1.0 ? 1.0 : t2;
	t2 = t2 < -1.0 ? -1.0 : t2;
	const y = Math.asin(t2);
  	
	const t0 = +2.0 * (dqw * dqx + dqy * dqz);
	const t1 = +1.0 - 2.0 * (dqx * dqx + ysqr);
	const x = Math.atan2(t0, t1);
	
	return {
		z,
		y,
		x
	}
}




export default {
	get
}