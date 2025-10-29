export const textAlign = ["left", "center", "right", "justify"] as const;
export const lengthUnits = ["px", "%", "em", "rem", "vw", "vh"] as const;
export const lengthUnitsGrid = ["fr"] as const;

export const headingTypes = ["h1", "h2", "h3", "h4", "h5", "h6", "p"] as const;

export const sizeOptions = [
	"none",
	"x-small",
	"small",
	"medium",
	"large",
	"x-large",
] as const;

export const widthOptions = [
	"container",
	"container-fluid",
	"w-100",
	"w-3/4",
	"w-2/3",
	"w-1/2",
	"w-1/3",
	"w-1/4",
	"w-1/6",
] as const;

export const backgroundAttachment = ["initial", "fixed"] as const;
export const backgroundPosition = [
	"initial",
	"top",
	"right",
	"bottom",
	"left",
	"center",
] as const;
export const backgroundRepeat = ["no-repeat", "repeat"] as const;

export const overlayEffects = [
	"darken",
	"lighten",
	"blur",
	"desaturate",
] as const;
