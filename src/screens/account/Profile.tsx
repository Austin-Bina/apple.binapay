import React, { useState } from "react";
import { View } from "react-native";
import { Appbar, Button } from "react-native-paper";
import { Country, CountryCode } from "react-native-country-picker-modal";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import ImageInput from "@components/ui/shared/ImageInput";
import { phoneValidation } from "@utils/phone";
import { PhoneInput } from "@components/ui/form/PhoneInput";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { Asset } from "react-native-image-picker";
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";

const schema = z.object({
  name: z.string().min(2, "Too Short").nonempty("Required").trim(),
  email: z.string().email("Invalid Email").nonempty("Required").trim(),
  phone: phoneValidation,
});

const Profile: React.FC<AccountStackScreenProps<"Profile">> = ({
  navigation,
}) => {
  const [fetching, setFetching] = useState(false);
  const [imageObject, setImageObject] = useState<Asset | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode>("NG");
  const [initialImageSource, setInitialImageUri] = useState(
    require("@assets/draft/male-avatar-circle.png")
  );

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "Abdul Amos",
      email: "abdul@gmail.com",
      phone: ["09121738252", "NG"],
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
    const formatedValues = {
      ...values,
      phone: values.phone?.[0],
    };

    console.log(formatedValues);
    navigation.navigate("Settings");
  });

  const handleChangeCountry = (country: Country) => {
    setCountryCode(country.cca2);
  };

  return (
    <Screen>
      <Appbar.Header style={tw`bg-white`}>
        <Appbar.Content
          title="Personal Information"
          titleStyle={tw`font-bold`}
        />
      </Appbar.Header>
      <ScrollableView style={tw`px-4`}>
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
                onChangeText={onChange}
                error={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { value } }) => (
              <PhoneInput
                identifier="phone"
                label="Phone"
                phone={value?.[0] || ""}
                onChangePhone={(phone) => {
                  setValue("phone", [phone, countryCode]);
                }}
                countryCode={countryCode}
                onChangeCountry={handleChangeCountry}
                error={!!errors.phone}
                errorMessage={errors.phone?.message}
                preferredCountries={["NG"]}
                clearErrorMessage={() => clearErrors("phone")}
              />
            )}
          />
        </View>
        <Button
          mode="contained"
          disabled={fetching}
          onPress={onSubmit}
          style={tw`my-10 rounded-full`}
          contentStyle={tw`py-2`}
        >
          {fetching ? "Saving..." : "Save Changes"}
        </Button>
      </ScrollableView>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
};

export default Profile;
