import Vec3 from "./Vec3";
import Vec2 from "./Vec2";

export default class MathUtils {
	public static clamp(num: number, min: number, max: number): number {
		return num <= min ? min : num >= max ? max : num;
	}

	public static lerp(start: number, end: number, amt: number): number {
		return (1 - amt) * start + amt * end
	}

	public static toRad(degrees: number): number {
		return degrees * Math.PI / 180;
	}

	public static toDeg(radians: number): number {
		return radians * 180 / Math.PI;
	}

	public static normalizeAngle(angle: number): number {
		return (angle %= 2 * Math.PI) >= 0 ? angle : (angle + 2 * Math.PI);
	}

	public static sphericalToCartesian(azimuth: number, altitude: number): Vec3 {
		return new Vec3(
			-Math.cos(altitude) * Math.cos(azimuth),
			-Math.sin(altitude),
			-Math.cos(altitude) * Math.sin(azimuth)
		)
	}

	public static degrees2meters(lat: number, lon: number): Vec2 {
		const z = lon * 20037508.34 / 180;
		const x = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 20037508.34 / Math.PI;
		return new Vec2(x, z);
	}

	public static meters2degrees(x: number, z: number): {lat: number; lon: number} {
		const lon = z * 180 / 20037508.34;
		const lat = Math.atan(Math.exp(x * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
		return {lat, lon};
	}

	public static degrees2tile(lat: number, lon: number, zoom = 16): Vec2 {
		const x = (lon + 180) / 360 * (1 << zoom);
		const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom);
		return new Vec2(x, y);
	}

	public static tile2degrees(x: number, y: number, zoom = 16): {lat: number; lon: number} {
		const n = Math.PI - 2 * Math.PI * y / (1 << zoom);
		const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
		const lon = x / (1 << zoom) * 360 - 180;
		return {lat, lon};
	}

	public static meters2tile(x: number, z: number, zoom = 16): Vec2 {
		const rx = (z + 20037508.34) / (2 * 20037508.34) * (1 << zoom);
		const ry = (1 - (x + 20037508.34) / (2 * 20037508.34)) * (1 << zoom);
		return new Vec2(rx, ry);
	}

	public static tile2meters(x: number, y: number, zoom = 16): Vec2 {
		const rz = (2 * 20037508.34 * x) / (1 << zoom) - 20037508.34;
		const rx = 20037508.34 - (2 * 20037508.34 * y) / (1 << zoom);
		return new Vec2(rx, rz);
	}

	public static getTilesIntersectingLine(a: Vec2, b: Vec2): Vec2[] {
		let x = Math.floor(a.x);
		let y = Math.floor(a.y);
		const endX = Math.floor(b.x);
		const endY = Math.floor(b.y);

		const points: Vec2[] = [new Vec2(x, y)];

		if (x === endX && y === endY) {
			return points;
		}

		const stepX = Math.sign(b.x - a.x);
		const stepY = Math.sign(b.y - a.y);

		const toX = Math.abs(a.x - x - Math.max(0, stepX));
		const toY = Math.abs(a.y - y - Math.max(0, stepY));

		const vX = Math.abs(a.x - b.x);
		const vY = Math.abs(a.y - b.y);

		let tMaxX = toX === 0 ? 0 : (toX / vX);
		let tMaxY = toY === 0 ? 0 : (toY / vY);

		const tDeltaX = 1 / vX;
		const tDeltaY = 1 / vY;

		while (!(x === endX && y === endY)) {
			if (tMaxX <= tMaxY) {
				tMaxX = tMaxX + tDeltaX;
				x = x + stepX;
			} else {
				tMaxY = tMaxY + tDeltaY;
				y = y + stepY;
			}

			points.push(new Vec2(x, y));
		}

		return points;
	}

	public static mercatorScaleFactor(lat: number): number {
		return 1 / Math.cos(MathUtils.toRad(lat));
	}

	public static shiftLeft(num: number, bits: number): number {
		return num * Math.pow(2, bits);
	}

	public static shiftRight(num: number, bits: number): number {
		return Math.floor(num / Math.pow(2, bits));
	}

	public static calculateNormal(vA: Vec3, vB: Vec3, vC: Vec3): Vec3 {
		let cb = Vec3.sub(vC, vB);
		const ab = Vec3.sub(vA, vB);
		cb = Vec3.cross(cb, ab);
		return Vec3.normalize(cb);
	}

	public static getBarycentricCoordinatesOfPoint(point: Vec2, triangle: number[] | TypedArray): Vec3 {
		const a = new Vec2(triangle[0], triangle[1]);
		const b = new Vec2(triangle[2], triangle[3]);
		const c = new Vec2(triangle[4], triangle[5]);

		const v0 = Vec2.sub(b, a);
		const v1 = Vec2.sub(c, a);
		const v2 = Vec2.sub(point, a);

		const den = v0.x * v1.y - v1.x * v0.y;
		const v = (v2.x * v1.y - v1.x * v2.y) / den;
		const w = (v0.x * v2.y - v2.x * v0.y) / den;
		const u = 1 - v - w;

		return new Vec3(u, v, w);
	}

	public static sign(p1: number[], p2: number[], p3: number[]): number {
		return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
	}

	public static isPointInTriangle(point: [number, number], triangle: [number, number][]): boolean {
		const [v1, v2, v3] = triangle;
		const d1 = MathUtils.sign(point, v1, v2);
		const d2 = MathUtils.sign(point, v2, v3);
		const d3 = MathUtils.sign(point, v3, v1);

		const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
		const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

		return !(has_neg && has_pos);
	}

	public static getIntersectionPoint(
		l1p1: [number, number], l1p2: [number, number],
		l2p1: [number, number], l2p2: [number, number]
	): [number, number] {
		const [x1, y1] = l1p1;
		const [x2, y2] = l1p2;
		const [x3, y3] = l2p1;
		const [x4, y4] = l2p2;

		// Check if none of the lines are of length 0
		if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
			return null;
		}

		const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

		// Lines are parallel
		if (denominator === 0) {
			return null;
		}

		const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
		const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

		// is the intersection along the segments
		if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
			return null;
		}

		const x = x1 + ua * (x2 - x1)
		const y = y1 + ua * (y2 - y1)

		return [x, y];
	}

	public static getIntersectionPointsLineTriangle(
		lineStart: [number, number], lineEnd: [number, number],
		triangle: [number, number][]
	): [number, number][] {
		const intersectionPoints = [];

		for(let i = 0; i < triangle.length; i++) {
			const next = (i + 1 == triangle.length) ? 0 : i + 1;
			const ip = MathUtils.getIntersectionPoint(lineStart, lineEnd, triangle[i], triangle[next]);

			if (ip) {
				intersectionPoints.push(ip);
			}
		}

		return intersectionPoints;
	}

	public static orderConvexPolygonPoints(points: [number, number][]): [number, number][] {
		let mX = 0;
		let mY = 0;

		for(const point of points) {
			mX += point[0];
			mY += point[1];
		}

		mX /= points.length;
		mY /= points.length;

		const atanValues: Map<[number, number], number> = new Map();

		for(const point of points) {
			atanValues.set(point, Math.atan2(point[1] - mY, point[0] - mX));
		}

		points.sort((a, b) => {
			return atanValues.get(a) - atanValues.get(b);
		});

		return points;
	}

	public static findIntersectionTriangleTriangle(tri1: [number, number][], tri2: [number, number][]): [number, number][] {
		const clippedCorners: [number, number][] = [];

		const addPoint = (p1: [number, number]): void => {
			if(clippedCorners.some(p2 => p1[0] === p2[0] && p1[1] === p2[1])) {
				return;
			}

			clippedCorners.push(p1);
		}

		for(const point of tri1) {
			if(MathUtils.isPointInTriangle(point, tri2)) {
				addPoint(point);
			}
		}

		for(const point of tri2) {
			if(MathUtils.isPointInTriangle(point, tri1)) {
				addPoint(point);
			}
		}

		for(let i = 0, next = 1; i < tri1.length; i++, next = (i + 1 == tri1.length) ? 0 : i + 1) {
			const points = MathUtils.getIntersectionPointsLineTriangle(tri1[i], tri1[next], tri2);

			for(const point of points) {
				addPoint(point);
			}
		}

		return MathUtils.orderConvexPolygonPoints(clippedCorners);
	}
}

