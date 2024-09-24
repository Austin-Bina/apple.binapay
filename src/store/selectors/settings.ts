import { State } from "@store/main";

export const selectSystemSettings = (state: State) => state.settings.system;
