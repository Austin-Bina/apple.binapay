type ProviderDetails = {
  id: number;
  key: string;
  label: string;
  logo: any;
};

export type ServiceProvidersMap = {
  internet: {
    [key: string]: ProviderDetails & {
      type: string[];
    };
  };
  education: {
    [key: string]: ProviderDetails & { description: string };
  };
  entertainment: {
    [key: string]: ProviderDetails;
  };
  electricity: {
    [key: string]: ProviderDetails;
  };
};

export interface RouteOptions {
  params?: Record<string, string | number>;
  version?: "v1";
  type?: "api" | "web";
}

export interface DataPlan {
  id: number;
  dataplan_id: string;
  network: number;
  plan_type: string;
  plan_network: string;
  month_validate: string;
  plan: string;
  plan_amount: string;
}
export interface CablePlan {
  cable: string;
  cableplan_id: string;
  id: number;
  package: string;
  plan_amount: string;
}

export type InternetProviders = "mtn" | "airtel" | "9mobile" | "glo";
