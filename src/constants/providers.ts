import { ServiceProvidersMap } from "@type/app";

export const serviceProvidersMap: ServiceProvidersMap = {
  internet: {
    mtn: {
      id: 1,
      key: "mtn",
      label: "MTN",
      logo: require("@assets/images/services/mtn.png"),
      type: ["VTU"],
    },
    glo: {
      key: "glo",
      label: "GLO",
      logo: require("@assets/images/services/glo.png"),
      id: 2,
      type: ["VTU"],
    },
    "9mobile": {
      id: 3,
      key: "9mobile",
      label: "9Mobile",
      logo: require("@assets/images/services/nine-mobile.png"),
      type: ["VTU"],
    },
    airtel: {
      id: 4,
      key: "airtel",
      label: "Airtel",
      logo: require("@assets/images/services/airtel.png"),
      type: ["VTU"],
    },
    // smile: {
    //     id: 5,
    //     key: "smile",
    //     label: "Smile",
    //     logo: require("@assets/images/services/smile.png")
    // },
  },
  education: {
    jamb: {
      id: 1,
      key: "jamb",
      label: "Jamb",
      description: "Joint Admission and Matriculation Board",
      logo: require("@assets/images/services/jamb.png"),
    },
    ibbu: {
      id: 2,
      key: "ibbu",
      label: "IBBU",
      description: "Institute of Management Technology",
      logo: require("@assets/images/services/ibbu.png"),
    },
    asam: {
      id: 2,
      key: "asam",
      label: "ASAM",
      description: "Association of Medical Lab. Scientists",
      logo: require("@assets/images/services/asam.png"),
    },
  },
  entertainment: {
    gotv: {
      id: 2,
      label: "Gotv",
      key: "gotv",
      logo: require("@assets/images/services/gotv.png"),
    },
    dstv: {
      id: 2,
      label: "Dstv",
      key: "dstv",
      logo: require("@assets/images/services/dstv.png"),
    },
    startime: {
      id: 2,
      label: "Startime",
      key: "startime",
      logo: require("@assets/images/services/startimes.png"),
    },
  },
  electricity: {
    ikedc: {
      id: 1,
      label: "Ikeja Electric Distribution Company (IKEDC)",
      key: "ikedc",
      logo: "",
    },
    ekedc: {
      id: 2,
      label: "Eko Electricity Distribution Company (EKEDC)",
      key: "ekedc",
      logo: "",
    },
    aedc: {
      id: 3,
      label: "Abuja Electricity Distribution Company (AEDC)",
      key: "aedc",
      logo: require("@assets/images/services/aedc.png"),
    },
    kedco: {
      id: 4,
      label: "Kano Electricity Distribution Company (KEDCO)",
      key: "kedco",
      logo: "",
    },
    eedc: {
      id: 5,
      label: "Enugu Electricity Distribution Company (EEDC)",
      key: "eedc",
      logo: "",
    },
    phed: {
      id: 6,
      label: "Port Harcourt Electricity Distribution Company (PHED)",
      key: "phed",
      logo: "",
    },
    ibedc: {
      id: 7,
      label: "Ibadan Electricity Distribution Company (IBEDC)",
      key: "ibedc",
      logo: "",
    },
    kaedco: {
      id: 8,
      label: "Kaduna Electric Distribution Company (KAEDCO)",
      key: "kaedco",
      logo: "",
    },
    jed: {
      id: 9,
      label: "Jos Electricity Distribution Company (JED)",
      key: "jed",
      logo: "",
    },
    bedc: {
      id: 10,
      label: "Benin Electricity Distribution Company (BEDC)",
      key: "bedc",
      logo: "",
    },
    yedc: {
      id: 11,
      label: "Yola Electricity Distribution Company (YEDC)",
      key: "yedc",
      logo: "",
    },
  },
};

export const INTERNET_PROVIDERS = ["mtn", "airtel", "9mobile", "glo"] as const;
