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
	showHeading: true,
	container: {
		class: "",
		width: "container-fluid",
		padding: "none",
		textAlign: "left",
		background: {
			color: "",
			image: "",
			overlay: [],
		},
	},
};
