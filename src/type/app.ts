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
