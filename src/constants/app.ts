const systemUser = {
  id: "system",
  name: "BinaPay Support",
  avatar: require("@assets/icon.png"),
};

const bvn_nin_mask = [/\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
const phone_mask = [/\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

export { systemUser, bvn_nin_mask, phone_mask };
