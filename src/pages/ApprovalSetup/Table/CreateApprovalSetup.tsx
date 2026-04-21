"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import { useStoreApprovalSetUp } from "../../../DynamicAPI/stores/Store/MasterStore";
import { useRoleStore } from "../../../API/store/MasterStore";
import { useNavigate } from "react-router-dom";

type ApprovalLevel = {
  level: number;
  level_name: string;
  description: string;
  role_id: number;
  is_required: boolean;
  can_skip: boolean;
  min_approvers: number;
  max_approvers: number;
  required_approvers: number;
  order: number;
};

type FormValues = {
  name: string;
  description: string;
  entity_type: string;
  is_active: boolean;
  require_all_levels: boolean;
  approval_levels: ApprovalLevel[];
};

const CreateAprrovalSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createData: createApproval } = useStoreApprovalSetUp();
  const { fetchRoles, roles: listRoles } = useRoleStore();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      entity_type: "",
      is_active: true,
      require_all_levels: false,
      approval_levels: [
        {
          level: 1,
          level_name: "",
          description: "",
          role_id: 0,
          is_required: true,
          can_skip: false,
          min_approvers: 1,
          max_approvers: 1,
          required_approvers: 1,
          order: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "approval_levels",
  });

  const entityTypeOptions = [
    { value: "STOCK_ADJUSTMENT", label: "STOCK_ADJUSTMENT" },
    { value: "MOVE_ORDER", label: "MOVE_ORDER" },
    { value: "OUTBOUND_MEMO", label: "OUTBOUND_MEMO" },
    { value: "INBOUND", label: "INBOUND" },
  ];

  const roleOptions = useMemo(() => {
    return listRoles.map((role) => ({
      value: role.id.toString(), // Convert to string untuk Select
      label: `${role.name}`,
    }));
  }, [listRoles]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      approval_levels: data.approval_levels.map((level, index) => ({
        ...level,
        level: index + 1,
        order: index,
      })),
    };

    try {
      await createApproval(payload);
      navigate("/approval");
    } catch (error) {
      console.error("Error creating approval:", error);
    }
  };

  const addApprovalLevel = () => {
    append({
      level: fields.length + 1,
      level_name: "",
      description: "",
      role_id: 0,
      is_required: true,
      can_skip: false,
      min_approvers: 1,
      max_approvers: 1,
      required_approvers: 1,
      order: fields.length,
    });
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Create Approval Setup
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header Information Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Header Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                {...(register("name", {
                  required: "Workflow name is required",
                }) as any)}
                id="name"
                placeholder="Enter workflow name"
                className="w-full"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="entity_type">Entity Type *</Label>
              <Select
                options={entityTypeOptions}
                placeholder="Select entity type"
                onChange={(value) => setValue("entity_type", value)}
                value={watch("entity_type")}
                width="100%"
              />
              {errors.entity_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.entity_type.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              id="description"
              placeholder="Enter workflow description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-6">
            <Checkbox
              label="Is Active"
              checked={watch("is_active")}
              onChange={(checked) => setValue("is_active", checked)}
            />
            <Checkbox
              label="Require All Levels"
              checked={watch("require_all_levels")}
              onChange={(checked) => setValue("require_all_levels", checked)}
            />
          </div>
        </section>

        {/* Approval Levels Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Approval Levels
            </h3>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={addApprovalLevel}
            >
              <FaPlus className="mr-2" /> Add Level
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-5 border-2 border-gray-200 rounded-lg bg-gray-50 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">
                  Approval Level {index + 1}
                </h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <FaTrash className="mr-1" /> Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`approval_levels.${index}.level_name`}>
                    Level Name *
                  </Label>
                  <Input
                    {...(register(`approval_levels.${index}.level_name`, {
                      required: "Level name is required",
                    }) as any)}
                    placeholder="e.g., Supervisor Approval"
                  />
                  {errors.approval_levels?.[index]?.level_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.approval_levels[index]?.level_name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`approval_levels.${index}.role_id`}>
                    Role *
                  </Label>
                  <Select
                    options={roleOptions}
                    placeholder="Select role"
                    onChange={(value) => {
                      setValue(
                        `approval_levels.${index}.role_id`,
                        parseInt(value)
                      );
                    }}
                    value={watch(
                      `approval_levels.${index}.role_id`
                    )?.toString()}
                    width="100%"
                  />
                  {errors.approval_levels?.[index]?.role_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.approval_levels[index]?.role_id?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`approval_levels.${index}.description`}>
                    Description
                  </Label>
                  <textarea
                    {...register(`approval_levels.${index}.description`)}
                    placeholder="Enter level description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor={`approval_levels.${index}.min_approvers`}>
                    Min Approvers *
                  </Label>
                  <Input
                    type="number"
                    {...(register(`approval_levels.${index}.min_approvers`, {
                      required: "Min approvers is required",
                      valueAsNumber: true,
                      validate: (value) => value >= 1 || "Minimum is 1",
                    }) as any)}
                    placeholder="1"
                  />
                  {errors.approval_levels?.[index]?.min_approvers && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.approval_levels[index]?.min_approvers?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`approval_levels.${index}.max_approvers`}>
                    Max Approvers *
                  </Label>
                  <Input
                    type="number"
                    {...(register(`approval_levels.${index}.max_approvers`, {
                      required: "Max approvers is required",
                      valueAsNumber: true,
                      validate: (value) => value >= 1 || "Minimum is 1",
                    }) as any)}
                    placeholder="1"
                  />
                  {errors.approval_levels?.[index]?.max_approvers && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.approval_levels[index]?.max_approvers?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor={`approval_levels.${index}.required_approvers`}
                  >
                    Required Approvers *
                  </Label>
                  <Input
                    type="number"
                    {...(register(
                      `approval_levels.${index}.required_approvers`,
                      {
                        required: "Required approvers is required",
                        valueAsNumber: true,
                        validate: (value) => value >= 1 || "Minimum is 1",
                      }
                    ) as any)}
                    placeholder="1"
                  />
                  {errors.approval_levels?.[index]?.required_approvers && (
                    <p className="text-red-500 text-sm mt-1">
                      {
                        errors.approval_levels[index]?.required_approvers
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Checkbox
                    label="Is Required"
                    checked={watch(`approval_levels.${index}.is_required`)}
                    onChange={(checked) =>
                      setValue(`approval_levels.${index}.is_required`, checked)
                    }
                  />
                  <Checkbox
                    label="Can Skip"
                    checked={watch(`approval_levels.${index}.can_skip`)}
                    onChange={(checked) =>
                      setValue(`approval_levels.${index}.can_skip`, checked)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" variant="primary" size="md">
            Create Approval Setup
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAprrovalSetup;
