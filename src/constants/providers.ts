import { ServiceProvidersMap } from "@type/app";

export const serviceProvidersMap: ServiceProvidersMap = {
  internet: {
    mtn: {
      label: "MTN",
      key: "mtn",
      logo: require("@assets/images/services/mtn.png"),
    },
    airtel: {
      key: "airtel",
      label: "Airtel",
      logo: require("@assets/images/services/airtel.png"),
    },
    "9mobile": {
      key: "9mobile",
      label: "9Mobile",
      logo: require("@assets/images/services/nine-mobile.png"),
    },
    glo: {
      key: "glo",
      label: "GLO",
      logo: require("@assets/images/services/glo.png"),
    },
  },
  education: {
    jamb: {
      key: "jamb",
      label: "Jamb",
      description: "Joint Admission and Matriculation Board",
      logo: require("@assets/images/services/jamb.png"),
    },
    ibbu: {
      key: "ibbu",
      label: "IBBU",
      description: "Institute of Management Technology",
      logo: require("@assets/images/services/ibbu.png"),
    },
    asam: {
      key: "asam",
      label: "ASAM",
      description: "Association of Medical Lab. Scientists",
      logo: require("@assets/images/services/asam.png"),
    },
  },
  entertainment: {
    gotv: {
      label: "Gotv",
      key: "gotv",
      logo: require("@assets/images/services/gotv.png"),
    },
    dstv: {
      label: "Dstv",
      key: "dstv",
      logo: require("@assets/images/services/dstv.png"),
    },
    startimes: {
      label: "Startimes",
      key: "startimes",
      logo: require("@assets/images/services/startimes.png"),
    },
    on_startimes: {
      label: "On Startimes",
      key: "on_startimes",
      logo: require("@assets/images/services/on-startimes.png"),
    },
  },
  electricity: {
    aedc: {
      label: "Abuja Electricity Distribution Company (AEDC)",
      key: "aedc",
      logo: require("@assets/images/services/aedc.png"),
    },
    ikejaElectric: {
      label: "Ikeja Electric Distribution Company",
      key: "ikejaElectric",
      logo: require("@assets/images/services/aedc.png"),
    },
    kanoDisco: {
      label: "Kano Electricity Distribution Company (KEDCO)",
      key: "kanoDisco",
      logo: require("@assets/images/services/aedc.png"),
    },
    phed: {
      label: "Port Harcourt Electricity Distribution Company (PHED)",
      key: "phed",
      logo: require("@assets/images/services/aedc.png"),
    },
  },
};

export const INTERNET_PROVIDERS = ["mtn", "airtel", "9mobile", "glo"] as const;
