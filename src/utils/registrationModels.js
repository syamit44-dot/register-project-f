import modelData from "../data/modelData";

export function getSelectedControllerModels(houses) {
  const models = new Map();
  for (const house of houses ?? []) {
    if (!house?.model_enabled) continue;
    for (const item of house.device_models ?? []) {
      if (item?.model && !models.has(item.model)) {
        models.set(item.model, item.model_name ?? modelData[item.model]?.name ?? item.model);
      }
    }
  }
  return models;
}
