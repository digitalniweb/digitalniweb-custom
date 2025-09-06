import type { widgetModels as widgetModelsType } from "../../digitalniweb-types/functionality/widgets";
// all widget models
export const widgetModels = ["WidgetText", "WidgetBanner"] as const;

// models of ArticleWidgets
export const widgetsModelsArticle: widgetModelsType[keyof widgetModelsType][] =
	["WidgetText", "WidgetBanner"] as const;
