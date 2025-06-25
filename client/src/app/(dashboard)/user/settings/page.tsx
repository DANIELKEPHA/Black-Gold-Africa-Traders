"use client";

import SettingsForm from "@/components/SettingsForm";
import {
  useGetAuthUserQuery,
  useUpdateUserMutation,
} from "@/state/api";
import React from "react";

const UserSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateUser] = useUpdateUserMutation();

  if (isLoading || !authUser?.userInfo) return <>Loading...</>;

  const initialData = {
    name: authUser.userInfo.name,
    email: authUser.userInfo.email,
    phoneNumber: authUser.userInfo.phoneNumber,
  };


  const handleSubmit = async (data: typeof initialData) => {
    await updateUser({
      cognitoId: authUser?.cognitoInfo?.userId,
      ...data,
    });
  };

  return (
      <SettingsForm
          initialData={initialData}
          onSubmit={handleSubmit}
          userType="user"
      />
  );
};

export default UserSettings;
