import React from "react";
import { View } from "react-native";
import { RegistrationStackScreenProps } from "@navigators/types";
import { RegistrationFormProvider } from "@providers/complete-registration";
import CreatePassword from "./CreatePassword";
import CreateTransactionPin from "./CreateTransactionPin";
import ChooseAvatar from "./ChooseAvatar";

const CompleteRegistration: React.FC<RegistrationStackScreenProps<"Complete Registration">> = (props) => {
  return (
    <RegistrationFormProvider defaultParams={props.route.params}>
      {({ state }) => (
        <View style={{ flex: 1 }}>
          {state.screenIndex === 0 && <CreatePassword {...props} />}
          {state.screenIndex === 1 && <CreateTransactionPin {...props} />}
          {state.screenIndex === 2 && <ChooseAvatar {...props} />}
        </View>
      )}
    </RegistrationFormProvider>
  );
};

export default CompleteRegistration;
