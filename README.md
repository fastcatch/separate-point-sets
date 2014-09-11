separate-point-sets
===================

These routines displace a set of points such that it won't overlap another set. (Note: both sets are 2D.) The method is based on the convex hulls of the two sets.

```points``` is an iterable collection of objects (such as an array or an associative array), in which each member (point) must have ```.x``` and ```.y``` properties.

Public functions
---

```
   function getConvexHull(points)
```

* input: a set of points
* result: returns the edges of the convex hull of the points (an array of edges)

Note: this function is made public out of general utility only

---

```
   function displacePoints(ptsFixed, ptsToDisplace, padding, pt1, pt2)
```

* Inputs:
 * two sets of points: fixed (```ptsFixed```) and to-be-displaced (```ptsToDisplace```)
 * ```padding```: the padding between the convex hulls after displacement (0 if omitted or falsey)
 * ```pt1```: the point in the fixed set that defines the starting point of the displacement direction vector
 * ```pt2```: if not falsey ```(pt1, pt2)``` defines the vector of the displacement;
 otherwise the displacement vector is from ```pt1``` to the nearest edge of the convex hull (perpendicular to the edge)

* Result: updates the .x and .y coordinates of points in ```pointsToDisplace```
