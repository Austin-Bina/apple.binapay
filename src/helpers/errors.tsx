// import * as Sentry from "@sentry/react-native";
// import { Alert } from "react-native";
// import {
//   setJSExceptionHandler,
//   setNativeExceptionHandler,
// } from "react-native-exception-handler";

// const errorHandler = (e: Error, isFatal: boolean) => {
//   Sentry.captureException(e);
//   if (isFatal) {
//     Alert.alert(
//       "Error Occurred",
//       `An error occurred: ${isFatal ? "Fatal:" : ""} ${e.name} ${e.message}. Please report this issue.`,
//       [
//         {
//           text: "Close",
//         },
//       ]
//     );
//   } else {
//     // eslint-disable-next-line no-console
//     console.log(e); // So that we can see it in the ADB logs in case of Android if needed
//   }
// };

// export default {
//   init() {
//     setNativeExceptionHandler((exceptionString) => {
//       Sentry.captureException(new Error(exceptionString), {});
//     }, false);
//     setJSExceptionHandler(errorHandler, false);
//   },
// };
