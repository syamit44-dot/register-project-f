import { useEffect, useMemo, useState } from "react";
import { fetchEquipmentModels, toFarmSummary } from "../api/client";

export function useFarmSummaries(records) {
  const [modelNames, setModelNames] = useState(() => new Map());
  const [catalogError, setCatalogError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const hasFarms = records.length > 0;

  useEffect(() => {
    if (!hasFarms) return;
    const controller = new AbortController();
    setCatalogError(false);
    fetchEquipmentModels(controller.signal)
      .then((models) => {
        if (!controller.signal.aborted) setModelNames(new Map(models.map(({ id, name }) => [id, name])));
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError(true);
      });
    return () => controller.abort();
  }, [hasFarms, attempt]);

  const farms = useMemo(() => records.map((record) => toFarmSummary(record, modelNames)), [records, modelNames]);
  return { farms, catalogError: hasFarms && catalogError, retryCatalog: () => setAttempt((value) => value + 1) };
}
