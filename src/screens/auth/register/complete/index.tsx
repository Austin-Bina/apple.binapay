import React from "react";
import Swiper from "react-native-swiper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { RegistrationFormProvider } from "src/contexts/complete-registration";
import CreatePassword from "./CreatePassword";
import CreateTransactionPin from "./CreateTransactionPin";
import ChooseAvatar from "./ChooseAvatar";

const CompleteRegistration: React.FC<RegistrationStackScreenProps<"Complete Registration">> = (props) => {
  return (
    <RegistrationFormProvider defaultParams={props.route.params}>
      {({ state, dispatch }) => (
        <Swiper
          loop={false}
          autoplay={false}
          onIndexChanged={(index) => {
            dispatch({ type: "updateScreenIndex", index });
          }}
          index={state.screenIndex}
          showsPagination={false}>
          <CreatePassword {...props} />
          <CreateTransactionPin {...props} />
          <ChooseAvatar {...props} />
        </Swiper>
      )}
    </RegistrationFormProvider>
  );
};

export default CompleteRegistration;
