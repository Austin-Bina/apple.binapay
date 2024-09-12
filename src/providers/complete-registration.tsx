import React, { createContext, useContext, useReducer } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type ActionType = { type: "updateScreenIndex"; index: number };

interface State {
  screenIndex: number;
}

interface ContextType {
  state: State;
  dispatch: React.Dispatch<ActionType>;
}

const initialState = {
  screenIndex: 0,
};

const RegistrationContext = createContext<ContextType>({
  dispatch: () => {},
  state: initialState,
});

const registrationReducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "updateScreenIndex":
      return {
        ...state,
        screenIndex: action.index,
      };

    default:
      return state;
  }
};

type ProviderProps = {
  children: (context: ContextType) => React.ReactNode;
  defaultParams: {
    email: string;
  };
};

const schema = z
  .object({
    email: z.string().email("Invalid email").trim(),
    password: z.string().min(8, "Too short").trim(),
    password_confirmation: z.string().min(8, "Too short").trim(),
    pin: z.string().min(4, "Too short").trim(),
    pin_confirmation: z.string().min(4, "Too short").trim(),
    avatar: z.string().min(2, "Too short").trim(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

export type RegistrationFormValues = z.infer<typeof schema>;

export const passwordFields = ["password", "password_confirmation"] as const;

export const transactionPinFields = ["pin", "pin_confirmation"] as const;

export const avatarFields = ["avatar"] as const;

export const RegistrationFormProvider: React.FC<ProviderProps> = ({ children, defaultParams }) => {
  const [state, dispatch] = useReducer(registrationReducer, initialState);
  const methods = useForm<RegistrationFormValues>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultParams.email,
      password: "",
      password_confirmation: "",
      pin: "",
      pin_confirmation: "",
      avatar: "male-avatar-1",
    },
  });

  return (
    <RegistrationContext.Provider value={{ state, dispatch }}>
      <FormProvider {...methods}>{children({ state, dispatch })}</FormProvider>
    </RegistrationContext.Provider>
  );
};

export const useCompleteRegisterForm = (): ContextType => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
};
