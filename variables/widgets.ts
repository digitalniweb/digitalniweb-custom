import type {
	widgetModels as widgetModelsType,
	widgetTextOptions,
} from "../../digitalniweb-types/functionality/widgets";
// all widget models
export const widgetModels = ["WidgetText", "WidgetBanner"] as const;

// models of ArticleWidgets
export const widgetsModelsArticle: widgetModelsType[keyof widgetModelsType][] =
	["WidgetText", "WidgetBanner"] as const;

export const widgetTextOptionsDefault: widgetTextOptions = {
	heading: {
		show: true,
		type: "h2",
		class: "none",
		weight: "regular",
		italic: false,
		uppercase: false,
	},
	container: {
		class: "",
		width: "container-fluid",
		height100: false,
		padding: "none",
		margin: "none",
		border: "none",
		borderRadius: "none",
		elevation: "none",
		textAlign: "left",
		background: {
			color: "",
			image: "",
			overlay: [],
		},
	},
};
