"use client";

import SettingsForm from "@/components/SettingsForm";
import { useGetAuthUserQuery, useUpdateAdminSettingsMutation } from "@/state/api";
import React from "react";

const AdminSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();

  const [updateAdmin] = useUpdateAdminSettingsMutation();

  if (isLoading || !authUser?.userInfo) return <>Loading...</>;

  if (authUser.userRole !== "admin") return <>Unauthorized</>;

  const initialData = {
    name: authUser.userInfo.name || "",
    email: authUser.userInfo.email || "",
    phoneNumber: authUser.userInfo.phoneNumber || "",
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateAdmin({
      cognitoId: authUser.cognitoInfo.userId,
      ...data,
    });
  };

  return (
      <SettingsForm
          initialData={initialData}
          onSubmit={handleSubmit}
          userType="admin"
      />
  );
};

export default AdminSettings;