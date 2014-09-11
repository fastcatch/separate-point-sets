/*
 *****************************************************************************************************************
 *
 * These routines displaces a set of points such that it won't overlap another set
 * (Note: both sets are 2D)
 *
 * The method is based on the convex hulls of the two sets
 *
 * points are an iterable collection of objects (such as an array or an associative array)
 *   that have .x and .y properties
 *
 * The following are the public functions:
 *
 *   getConvexHull(points)
 *   => takes a set of points
 *   => returns the edges of the convex hull of the points (an array of edges)
 *   NB: public for general utility only
 *
 *   function displacePoints(ptsFixed, ptsToDisplace, padding, pt1, pt2)
 *   => takes two sets of points: fixed and to-be-displaced,
 *      padding: the padding between the convex hulls after displacement (0 if omitted or falsey)
 *      pt1: the point in the fixed set that defines the starting point of the displacement direction vector
 *      pt2: if not falsey (pt1, pt2) defines the vector of the displacement;
 *           otherwise the displacement vector is from pt1 to the nearest edge of the convex hull (perpendicular to the edge)
 *   => updates the .x and .y coordinates of points in pointsToDisplace
 *
 *****************************************************************************************************************
 */

/*
 * QuickHull algorithm to find to convex hull of a set of points
 * Based on http://en.literateprograms.org/Quickhull_(Javascript)
 *
 * Notes:
 *   1. call getConvexHull with node objects (must be iterable)
 *   2. it will return the ones that are on the convex hull (in an array), in the order they are vertices of the hull
 *   3. point objects must have 'x' & 'y' properties (co-ordinates)
 */
function getConvexHull(points) {

	function findMostDistantPointFromBaseLine(baseLine, points) {
		var maxD = 0,
		maxPt = null,
		newPoints = [],
		Vy = baseLine[1].x - baseLine[0].x,
		Vx = baseLine[0].y - baseLine[1].y;

		for (var idx = 0; idx < points.length; idx++) {
			var pt = points[idx];
			var distance = (Vx * (pt.x - baseLine[0].x) + Vy * (pt.y - baseLine[0].y));

			if (distance > 0) {
				newPoints.push(pt);
				if (distance > maxD) {
					maxD = distance;
					maxPt = pt;
				}
			}
		}

		return {
			'maxPoint' : maxPt,
			'newPoints' : newPoints
		};
	}

	function buildConvexHull(baseLine, points) {
		var convexHullBaseLines = [];
		var t = findMostDistantPointFromBaseLine(baseLine, points);
		if (t.maxPoint !== null) { // if there is still a point "outside" the base line
			convexHullBaseLines =
				convexHullBaseLines.concat(
					buildConvexHull([baseLine[0], t.maxPoint], t.newPoints));
			convexHullBaseLines =
				convexHullBaseLines.concat(
					buildConvexHull([t.maxPoint, baseLine[1]], t.newPoints));
			return convexHullBaseLines;
		} else { // if there is no more point "outside" the base line, the current base line is part of the convex hull
			return [baseLine];
		}
	}

	/*
	 * main function body of getConvexHull
	 */

	// find first baseline
	var maxX,
	minX;
	var maxPt,
	minPt;
	var ptsArray = []; // make sure points are in an array not in an object (speed opt)
	for (var idx in points) {
		var pt = points[idx];
		ptsArray.push(pt);
		if (pt.x > maxX || !maxX) {
			maxPt = pt;
			maxX = pt.x;
		}
		if (pt.x < minX || !minX) {
			minPt = pt;
			minX = pt.x;
		}
	}

	// build hull
	var ch = [];
	if (ptsArray.length >= 3)
		ch.concat(buildConvexHull([minPt, maxPt], ptsArray), buildConvexHull([maxPt, minPt], ptsArray));
	return ch;
}

/*
 * displacePoints will displace (move each point of) ptsToDisplace such that:
 *   - the convex hull of ptsFixed and that of ptsToDisplace will not intersect
 *   - displacement direction is determined such that pt1 be moved the least (within its bounding hull)
 */
function displacePoints(ptsFixed, ptsToDisplace, padding, pt1, pt2) {
	/*
	 * Check if lines (line segments) intersect
	 *
	 * if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite)
	 *  and booleans for whether line segment 1 or line segment 2 contain the point
	 */
	function checkLineIntersection(line1Start, line1End, line2Start, line2End) {
		var denominator,
		a,
		b,
		numerator1,
		numerator2,
		result = {
			x : null,
			y : null,
			onLine1 : false,
			onLine2 : false
		};
		denominator = ((line2End.y - line2Start.y) * (line1End.x - line1Start.x)) - ((line2End.x - line2Start.x) * (line1End.y - line1Start.y));
		if (denominator === 0) {
			return result;
		}
		a = line1Start.y - line2Start.y;
		b = line1Start.x - line2Start.x;
		numerator1 = ((line2End.x - line2Start.x) * a) - ((line2End.y - line2Start.y) * b);
		numerator2 = ((line1End.x - line1Start.x) * a) - ((line1End.y - line1Start.y) * b);
		a = 1.0 * numerator1 / denominator;
		b = 1.0 * numerator2 / denominator;

		// if we cast these lines infinitely in both directions, they intersect here:
		result.x = line1Start.x + (a * (line1End.x - line1Start.x));
		result.y = line1Start.y + (a * (line1End.y - line1Start.y));
		/*
		// it is worth noting that this should be the same as:
		x = line2Start.x + (b * (line2End.x - line2Start.x));
		y = line2Start.x + (b * (line2End.y - line2Start.y));
		 */
		// if line1 is a segment and line2 is infinite, they intersect if:
		if (a > 0 && a < 1) {
			result.onLine1 = true;
		}
		// if line2 is a segment and line1 is infinite, they intersect if:
		if (b > 0 && b < 1) {
			result.onLine2 = true;
		}
		// if line1 and line2 are segments, they intersect if both of the above are true
		return result;
	}

	function sqr(x) {
		return x * x;
	}
	function dist2(pt1, pt2) {
		return sqr(pt1.x - pt2.x) + sqr(pt1.y - pt2.y);
	}
	function distToSegmentSquared(pt, v1, v2) {
		var l2 = dist2(v1, v2);
		if (l2 === 0)
			return dist2(pt, v1);
		var t = ((pt.x - v1.x) * (v2.x - v1.x) + (pt.y - v1.y) * (v2.y - v1.y)) / l2;
		if (t < 0)
			return dist2(pt, v1);
		if (t > 1)
			return dist2(pt, v2);
		return dist2(pt, {
			x : v1.x + t * (v2.x - v1.x),
			y : v1.y + t * (v2.y - v1.y)
		});
	}
	function distToSegment(pt, v1, v2) {
		return Math.sqrt(distToSegmentSquared(pt, v1, v2));
	}

	function findMostDistantPointFromLine(linePt1, linePt2, convexHull) {
		var maxD = 0;
		var maxPt = null;
		var Vy = linePt2.x - linePt1.x;
		var Vx = linePt1.y - linePt2.y;

		for (var idx = 0; idx < convexHull.length; idx++) {
			for (var i = 0; i <= 1; i++) {
				var pt = convexHull[idx][i];
				var distance = (Vx * (pt.x - linePt1.x) + Vy * (pt.y - linePt1.y));

				if (distance > 0 && distance > maxD) {
					maxD = distance;
					maxPt = pt;
				}
			}
		}

		return maxPt;
	}

	/*
	 * Min distance vector
	 *
	 * Given a convex polygon (such as a convex hull) and a point
	 * it returns minimum sized vector by which the point can be moved
	 *    to be on the (nearest) edge of the polygon + the edge
	 */
	function minDistanceVector(convexHull, pt) {
		var minDist = null,
		minDistIndex = null;
		for (var i = 0; i < convexHull.length; i++) {
			var tmpDist = distToSegment(pt, convexHull[i][0], convexHull[i][1]);
			if (minDist === null || tmpDist < minDist) {
				minDist = tmpDist;
				minDistIndex = i;
			}
		}

		if (minDist !== null) {
			var dx = convexHull[minDistIndex][0].x - convexHull[minDistIndex][1].x,
			dy = convexHull[minDistIndex][0].y - convexHull[minDistIndex][1].y,
			pp2 = {
				x : pt.x + dy,
				y : pt.y - dx
			},
			intersectionData = checkLineIntersection(pt, pp2, convexHull[minDistIndex][0], convexHull[minDistIndex][1]);
			return ({
				vector : {
					x : intersectionData.x - pt.x,
					y : intersectionData.y - pt.y
				},
				edge : [convexHull[minDistIndex][0], convexHull[minDistIndex][1]]
			});
		} else {
			// It only happens if convexHull is empty
			console.log('Null distance vector');
			return (null);
		}
	}

	/*
	 * Min distance (to any edge in a direction)
	 *
	 * Given a convex polygon (such as a convex hull), a point (pt) and a direction (pt, v)
	 * it returns minimum sized vector by which the point can be moved
	 *    to be on the (nearest) edge of the polygon + the edge in the direction of the vector
	 *
	 * NB: there is exactly one such vector (unless pt is on an edge)
	 */
	function sameSign(a, b) {
		return (a < 0 && b < 0) || (a >= 0 && b >= 0);
	}
	function sameDirection(pt11, pt12, pt21, pt22) {
		return sameSign(pt12.x - pt11.x, pt22.x - pt21.x) && sameSign(pt12.y - pt11.y, pt22.y - pt21.y);
	}
	function minDistanceVectorInDirection(convexHull, pt, v) {
		for (var i = 0; i < convexHull.length; i++) {
			// get line-segment intersection
			var intersectionData = checkLineIntersection(pt, v, convexHull[i][0], convexHull[i][1]);
			// if its inside the edge and if the intersection is in the direction of (pt,v) (and not on the reverse side)
			if (intersectionData.onLine2 && sameDirection(pt, v, pt, intersectionData)) {
				// got edge
				// find more distant vertex
				var mostDistantPoint = findMostDistantPointFromLine(pt, {
						x : pt.x + (v.y - pt.y),
						y : pt.y - (v.x - pt.x)
					}, convexHull);
				return {
					vector : {
						x : -pt.x + mostDistantPoint.x,
						y : -pt.y + mostDistantPoint.y
					},
					edge : [convexHull[i][0], convexHull[i][1]]
				};
			}
		}
		// It only happens if convexHull is empty
		console.log('Null distance vector');
		return (null);
	}

	/*
	 * main body of displacePoints
	 */
	// calculate both convex hulls
	var chFixed = getConvexHull(ptsFixed),
	chDisplace = getConvexHull(ptsToDisplace);
	if (chFixed.length < 3 || chDisplace.length < 3)
		return;
	// calculate vector to move pt1 by
	if (!pt1) { // if pt1 is false-y, use center of ptsFixed
		var pt1 = {
			x : 0.0,
			y : 0.0
		};
		for (var i = 0; i < chFixed.length; i++) {
			pt1.x += chFixed[i][0].x;
			pt1.y += chFixed[i][0].y;
		}
		pt1.x /= chFixed.length;
		pt1.y /= chFixed.length;
	}

	var displacementDataFromFixed,
	displacementDirection;

	if (!pt2) { // if pt2 is false-y, use the minimum distance from pt1 to the edge of chFixed
		displacementDataFromFixed = minDistanceVector(chFixed, pt1);
	} else { // find the vector between pt1 to the edge of chFixed in the direction of (pt1,pt2)
		displacementDataFromFixed = minDistanceVectorInDirection(chFixed, pt1, pt2);
	}
	displacementDirection = displacementDataFromFixed.vector;

	// calculate separating axis (vector)
	var separatingAxisVector;
	if (displacementDirection.x !== 0 || displacementDirection.y !== 0) {
		separatingAxisVector = {
			x : (-1 * displacementDirection.y),
			y :  - (-1 * displacementDirection.x)
		};
	} else { // if pt1 is on the convex hull use edge rotated by 90 degrees as separating axis vector
		var dx = displacementDataFromFixed.edge[0].x - displacementDataFromFixed.edge[1].x,
		dy = displacementDataFromFixed.edge[0].y - displacementDataFromFixed.edge[1].y;
		separatingAxisVector = {
			x : dx,
			y : dy
		};
	}

	// calculate displacement vector by which points in ptsToDisplace need to be moved
	var separatingPoint = {
		x : pt1.x + displacementDataFromFixed.vector.x,
		y : pt1.y + displacementDataFromFixed.vector.y
	};
	var farthestPoint = findMostDistantPointFromLine(separatingPoint, {
			x : separatingPoint.x + separatingAxisVector.x,
			y : separatingPoint.y + separatingAxisVector.y
		}, chDisplace);
	var vDisplace = {
		x : separatingPoint.x - farthestPoint.x,
		y : separatingPoint.y - farthestPoint.y
	};

	// calculate padding vector: direction is separatingAxisVector rotated by 90 degrees and its length is 'padding'
	if (!padding) {
		var padding = 0.0;
	}
	var len = Math.sqrt(separatingAxisVector.x * separatingAxisVector.x + separatingAxisVector.y * separatingAxisVector.y),
	vPadding = {
		x : 1.0 * separatingAxisVector.y * (padding / len),
		y : -1.0 * separatingAxisVector.x * (padding / len)
	};

	// calculate total displacement (add safety distances (vectors) and adjust for padding)
	var displace_dx = vDisplace.x + vPadding.x,
	displace_dy = vDisplace.y + vPadding.y;

	// do displace points
	for (var pts in ptsToDisplace) {
		ptsToDisplace[pts].x += displace_dx;
		ptsToDisplace[pts].y += displace_dy;
	}
}
