type ProviderDetails = {
  key: string;
  label: string;
  logo: any;
};

export type ServiceProvidersMap = {
  internet: {
    [key: string]: ProviderDetails;
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
