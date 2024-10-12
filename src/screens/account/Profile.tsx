import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import ImageInput from "@components/ui/shared/ImageInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { Asset } from "react-native-image-picker";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsAccountVerified, selectUser } from "@store/selectors/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { authSliceActions } from "@store/slice/auth";
import { AxiosError } from "axios";
import { getNavigate } from "@utils/navigation";
import { zodPhoneValidation } from "@utils/phone";

const schema = z.object({
  name: z.string().min(2, "Too Short").trim(),
  email: z
    .string()
    .email("Please enter a valid email")
    .trim()
    .transform((val) => val.toLowerCase()),
  phone: zodPhoneValidation,
});

type FormValues = z.infer<typeof schema>;

const Profile: React.FC<AccountStackScreenProps<"Profile">> = ({ navigation }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageObject, setImageObject] = useState<Asset | null>(null);
  const [initialImageSource, setInitialImageUri] = useState(require("@assets/draft/male-avatar-circle.png"));

  const user = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const dispatch = useTypedDispatch();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    },
    resolver: zodResolver(schema),
  });

  const handleAddImage = (imageObj: Asset) => {
    setImageObject(imageObj);
  };

  const handleRemoveImage = () => {
    setImageObject(null);
    setInitialImageUri(null);
  };

  const onSubmit = handleSubmit(async function (values) {
    const result = zodPhoneValidation.safeParse([values.phone, "NG"]);

    if (!result.success) {
      const errorMessage = result.error.errors[0].message;
      setError("phone", { message: errorMessage });
      return showToast({ message: errorMessage });
    }

    setIsProcessing(true);
    try {
      const response = await API.post(route("account.updateProfile"), values);
      const { user } = response.data;

      dispatch(authSliceActions.updateUser(user));
      const { reset } = await getNavigate();

      reset({
        routes: [
          {
            name: "Home",
            params: {
              screen: "Dashboard",
            },
          },
        ],
      });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }
        }
      } else {
        showToast({ message: "Something went wrong. Please try again." });
      }
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <Screen>
      <View style={tw`flex flex-col pt-5 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed px-4`}>Personal Information</Text>
        </View>
        <ScrollableView style={tw`px-4 pt-5`}>
          <ImageInput
            source={imageObject ? imageObject : initialImageSource}
            onChangeImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
          />

          <View>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Full Name"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Email Address"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  disabled={isVerified}
                  onChangeText={onChange}
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Phone Number"
                  placeholder="+234 000 000 0000"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                />
              )}
            />
          </View>
          <Button
            mode="contained"
            disabled={isProcessing}
            onPress={onSubmit}
            style={tw`my-10 rounded-full`}
            contentStyle={tw`py-2`}>
            Save Changes
          </Button>
        </ScrollableView>
        <PleaseWaitModal visible={isProcessing} />
      </View>
    </Screen>
  );
};

export default Profile;
