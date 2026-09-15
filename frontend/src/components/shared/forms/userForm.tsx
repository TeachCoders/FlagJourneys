"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/PasswordInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormActionButton from "@/components/shared/customBtns";
import { successToast, errorToast } from "@/components/shared/tost";
import { useCreateNewUser, useUpdateUser } from "@/feature/auth/api/useAuth";
import { useGetTeam } from "@/feature/teams/api/useTeam";

interface UserFormProps {
  onSuccess?: () => void;
  teamId?: number | null;
  teamName?: string;
  initialData?: any;
}

export function UserForm({ onSuccess, teamId, teamName, initialData }: UserFormProps) {
  const { createUser, isCreatingUser } = useCreateNewUser();
  const { updateUser, isUpdatingUser } = useUpdateUser();
  const { teams = [] } = useGetTeam();
  
  const isEditing = !!initialData?.id;
  const autoRole = teamName ? teamName.toLowerCase().replace(/[\s-]+/g, "_").replace(/\s+/g, "_") : "";

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    emailPrefix: initialData?.email ? initialData.email.split("@")[0] : "",
    mobile: initialData?.mobile || "",
    role: initialData?.role || autoRole || "team_member",
    teamId: initialData?.teamId?.toString() || teamId?.toString() || "",
    password: "",
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const isLoading = isCreatingUser || isUpdatingUser;

  const [files, setFiles] = useState<{ profile: File | null; banner: File | null }>({
    profile: null,
    banner: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({
        ...prev,
        [name === "profileImage" ? "profile" : "banner"]: selectedFiles[0],
      }));
    }
  };

const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
    e.preventDefault();

    if (!initialData?.id && !formData.password) {
      errorToast("Password is required for new users.");
      return;
    }

    const activeDomain = "flagjourneys.com";

    const fullEmail = `${formData.emailPrefix}@${activeDomain}`;
    const submissionData = new FormData();
    submissionData.append("name", formData.name);
    submissionData.append("email", fullEmail);
    if (formData.mobile) submissionData.append("mobile", formData.mobile);
    submissionData.append("role", formData.role);
    if (formData.teamId) {
      submissionData.append("teamId", formData.teamId);
    }
    if (formData.password) {
      submissionData.append("password", formData.password);
    }
    submissionData.append("isActive", String(formData.isActive));
    if (files.profile) submissionData.append("profileImage", files.profile);
    if (files.banner) submissionData.append("bannerImage", files.banner);

    try {
      if (initialData?.id) {
        await updateUser({ id: initialData.id, payload: submissionData });
        successToast(`Member updated successfully!`);
      } else {
        await createUser(submissionData);
        successToast(`Member created successfully with email: ${fullEmail}`);
      }
      
      if (onSuccess) onSuccess();
      // Reset form after success
      setFormData({ name: "", emailPrefix: "", mobile: "", role: "team_member", teamId: "", password: "", isActive: true });
      setFiles({ profile: null, banner: null });
    } catch (error: any) {
      console.error("Submission Error:", error);
      errorToast(error?.response?.data?.message || "Failed to process member. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="border-gray-200 focus:border-brand-500"
          />
        </div>

        {/* Email with Domain Suffix */}
        <div className="space-y-2">
          <Label htmlFor="emailPrefix" className="text-sm font-medium text-gray-700">Email Username</Label>
          <div className="flex items-center">
            <Input
              id="emailPrefix"
              name="emailPrefix"
              placeholder="john.doe"
              value={formData.emailPrefix}
              onChange={handleInputChange}
              className="rounded-r-none border-r-0 border-gray-200 focus:border-brand-500 focus:ring-0"
            />
            <div className="bg-gray-50 border border-gray-200 border-l-0 px-3 py-1 text-sm text-gray-500 rounded-r-lg min-w-fit h-8 flex items-center justify-center">
              @flagjourneys.com
            </div>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Number</Label>
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            placeholder="e.g. 9876543210"
            value={formData.mobile}
            onChange={handleInputChange}
            required
            className="border-gray-200 focus:border-brand-500"
          />
        </div>

        {/* Role */}
        <div className="space-y-2 w-full max-w-sm">
          <Label htmlFor="role" className="text-sm font-medium text-gray-700">User Role</Label>
          {isEditing ? (
            <Select onValueChange={handleSelectChange} defaultValue={formData.role}>
              <SelectTrigger className="border-gray-200 w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Admin</SelectItem>
                <SelectItem value="team_leader">Team Leader</SelectItem>
                <SelectItem value="team_member">Team Member</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-700 capitalize">{formData.role?.replace(/_/g, " ")}</span>
              <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">Auto (from team)</span>
            </div>
          )}
        </div>

        {/* Transfer to Team (only in edit mode) */}
        {isEditing && (
          <div className="space-y-2 w-full max-w-sm">
            <Label className="text-sm font-medium text-gray-700">Transfer to Team</Label>
            <Select
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, teamId: val }));
                const selectedTeam = teams.find((t: any) => t.id.toString() === val);
                if (selectedTeam) {
                  const autoRole = selectedTeam.name.toLowerCase().replace(/[\s-]+/g, "_").replace(/\s+/g, "_");
                  setFormData((prev) => ({ ...prev, teamId: val, role: autoRole }));
                }
              }}
              defaultValue={formData.teamId}
            >
              <SelectTrigger className="border-gray-200 w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t: any) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">User will be removed from current team and added to selected team</p>
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            {initialData ? "Update Password (Optional)" : "Initial Password"}
          </Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            required={!initialData?.id}
            className="border-gray-200 focus:border-brand-500"
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center space-x-2 py-2 mt-6">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            User is active
          </Label>
        </div>
      </div>

      {/* Image Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 sm:pt-0">
        <div className="space-y-2">
          <Label htmlFor="profileImage" className="text-sm font-medium text-gray-700">Profile Image</Label>
          <Input
            id="profileImage"
            name="profileImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer file:bg-brand-50 file:text-brand-700 border-gray-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bannerImage" className="text-sm font-medium text-gray-700">Banner Image</Label>
          <Input
            id="bannerImage"
            name="bannerImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer file:bg-brand-50 file:text-brand-700 border-gray-200"
          />
        </div>
      </div>

      <div className="pt-4">
        <FormActionButton
          text={isLoading ? (initialData ? "Updating Member..." : "Creating Member...") : (initialData ? "Update Member" : "Create Member")}
          type="submit"
          isLoading={isLoading}
          fullWidth
          size="lg"
          className="shadow-sm"
        />
      </div>
    </form>
  );
}
