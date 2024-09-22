import { createSelector } from "@reduxjs/toolkit";
import { supportApi } from "@store/redux-api/supportApi";

const selectSupportDepartmentResult = supportApi.endpoints.getSupportDepartments.select();

const selectSupportDepartment = (departmentId: string) =>
  createSelector([selectSupportDepartmentResult], (result) => {
    if (result?.data) {
      const { departments } = result.data;
      return departments.find((department) => department.id === departmentId);
    }
  });

export { selectSupportDepartment };
