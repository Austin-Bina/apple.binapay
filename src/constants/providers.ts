import { ServiceProvidersMap } from "@type/app";

export const serviceProvidersMap: ServiceProvidersMap = {
  internet: {
    mtn: {
      id: 1,
      serviceId: "mtn",
      name: "MTN",
      logo: require("@assets/images/services/mtn.png"),
      type: ["VTU"],
    },
    glo: {
      serviceId: "glo",
      name: "GLO",
      logo: require("@assets/images/services/glo.png"),
      id: 2,
      type: ["VTU"],
    },
    "9mobile": {
      id: 3,
      serviceId: "9mobile",
      name: "9Mobile",
      logo: require("@assets/images/services/nine-mobile.png"),
      type: ["VTU"],
    },
    airtel: {
      id: 4,
      serviceId: "airtel",
      name: "Airtel",
      logo: require("@assets/images/services/airtel.png"),
      type: ["VTU"],
    },
  },
  education: {
    jamb: {
      id: 1,
      serviceId: "jamb",
      name: "Jamb",
      description: "Joint Admission and Matriculation Board",
      logo: require("@assets/images/services/jamb.png"),
    },
    ibbu: {
      id: 2,
      serviceId: "ibbu",
      name: "IBBU",
      description: "Institute of Management Technology",
      logo: require("@assets/images/services/ibbu.png"),
    },
    asam: {
      id: 2,
      serviceId: "asam",
      name: "ASAM",
      description: "Association of Medical Lab. Scientists",
      logo: require("@assets/images/services/asam.png"),
    },
  },
  entertainment: {
    gotv: {
      id: 2,
      name: "Gotv",
      serviceId: "gotv",
      logo: require("@assets/images/services/gotv.png"),
    },
    dstv: {
      id: 2,
      name: "Dstv",
      serviceId: "dstv",
      logo: require("@assets/images/services/dstv.png"),
    },
    startime: {
      id: 2,
      name: "Startime",
      serviceId: "startime",
      logo: require("@assets/images/services/startimes.png"),
    },
  },
  electricity: {
    ikedc: {
      id: 1,
      name: "Ikeja Electric Distribution Company (IKEDC)",
      serviceId: "ikedc",
      logo: "",
    },
    ekedc: {
      id: 2,
      name: "Eko Electricity Distribution Company (EKEDC)",
      serviceId: "ekedc",
      logo: "",
    },
    aedc: {
      id: 3,
      name: "Abuja Electricity Distribution Company (AEDC)",
      serviceId: "aedc",
      logo: require("@assets/images/services/aedc.png"),
    },
    kedco: {
      id: 4,
      name: "Kano Electricity Distribution Company (KEDCO)",
      serviceId: "kedco",
      logo: "",
    },
    eedc: {
      id: 5,
      name: "Enugu Electricity Distribution Company (EEDC)",
      serviceId: "eedc",
      logo: "",
    },
    phed: {
      id: 6,
      name: "Port Harcourt Electricity Distribution Company (PHED)",
      serviceId: "phed",
      logo: "",
    },
    ibedc: {
      id: 7,
      name: "Ibadan Electricity Distribution Company (IBEDC)",
      serviceId: "ibedc",
      logo: "",
    },
    kaedco: {
      id: 8,
      name: "Kaduna Electric Distribution Company (KAEDCO)",
      serviceId: "kaedco",
      logo: "",
    },
    jed: {
      id: 9,
      name: "Jos Electricity Distribution Company (JED)",
      serviceId: "jed",
      logo: "",
    },
    bedc: {
      id: 10,
      name: "Benin Electricity Distribution Company (BEDC)",
      serviceId: "bedc",
      logo: "",
    },
    yedc: {
      id: 11,
      name: "Yola Electricity Distribution Company (YEDC)",
      serviceId: "yedc",
      logo: "",
    },
  },
};

export const INTERNET_PROVIDERS = ["mtn", "airtel", "9mobile", "glo"] as const;
