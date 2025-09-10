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
	padding: 0,
	overlay: false,
	paddingUnits: "px",
	showHeading: true,
	textAlign: "left",
};
