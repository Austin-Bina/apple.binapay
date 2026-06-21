declare module "react-native-identity-kyc" {
  export interface IdentityKycProps {
    merchant_key: string;
    config_id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_ref: string;
    is_test?: boolean;
    showDefaultButton?: boolean;
    buttonText?: string;
    btnStyles?: any;
    textStyles?: any;
    containerStyle?: any;
    loaderColor?: string;
    customButton?: (openWidget: () => void) => React.ReactNode;
    onVerified?: (data: any) => void;
    onError?: (data: any) => void;
    onCancel?: (data: any) => void;
  }

  const IdentityKyc: React.ForwardRefExoticComponent<
    IdentityKycProps & React.RefAttributes<any>
  >;

  export default IdentityKyc;
}
