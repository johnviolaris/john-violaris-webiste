"use client";
import { createContext, useContext, type ReactNode } from "react";
import { defaultIntegrationSettings, type IntegrationSettings } from "@/lib/cms/seo/integrations";

const IntegrationContext = createContext<IntegrationSettings>(defaultIntegrationSettings);

export function IntegrationProvider({ settings, children }: { settings: IntegrationSettings; children: ReactNode }) {
  return <IntegrationContext.Provider value={settings}>{children}</IntegrationContext.Provider>;
}

export function useIntegrationSettings() { return useContext(IntegrationContext); }
