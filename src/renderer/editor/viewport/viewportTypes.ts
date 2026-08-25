export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// zoom is expressed as physical device pixels per image pixel: 1 = actual
// size (one image pixel maps to one physical screen pixel), independent of
// devicePixelRatio. offsetX/offsetY are in CSS pixels — the position of the
// image's (0,0) corner within the viewport container.
export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}
