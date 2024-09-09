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
    etisalat: {
      id: 3,
      key: "etisalat",
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
    startimes: {
      id: 2,
      label: "Startimes",
      key: "startimes",
      logo: require("@assets/images/services/startimes.png"),
    },
    on_startimes: {
      id: 2,
      label: "On Startimes",
      key: "on_startimes",
      logo: require("@assets/images/services/on-startimes.png"),
    },
  },
  electricity: {
    aedc: {
      id: 2,
      label: "Abuja Electricity Distribution Company (AEDC)",
      key: "aedc",
      logo: require("@assets/images/services/aedc.png"),
    },
    ikejaElectric: {
      id: 2,
      label: "Ikeja Electric Distribution Company",
      key: "ikejaElectric",
      logo: require("@assets/images/services/aedc.png"),
    },
    kanoDisco: {
      id: 2,
      label: "Kano Electricity Distribution Company (KEDCO)",
      key: "kanoDisco",
      logo: require("@assets/images/services/aedc.png"),
    },
    phed: {
      id: 2,
      label: "Port Harcourt Electricity Distribution Company (PHED)",
      key: "phed",
      logo: require("@assets/images/services/aedc.png"),
    },
  },
};

export const INTERNET_PROVIDERS = ["mtn", "airtel", "9mobile", "glo"] as const;
