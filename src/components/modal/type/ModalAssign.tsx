import React, { useState, useMemo } from "react";
import ModalComponent from "../ModalComponent";
import Button from "../../ui/button/Button";
import { FaEye, FaPlus } from "react-icons/fa";

interface ReusableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formFields: Array<any>;
  title: string;
  defaultValues?: any;
  isEditMode?: boolean;
  setIsEditMode?: (val: boolean) => void;
  parmeters?: any;
}

const ReusableFormModal: React.FC<ReusableFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formFields,
  title,
  defaultValues,
  isEditMode = false,
  parmeters,
}) => {
  return (
    <>
      <ModalComponent
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? "Update Detail" : title}
        size="medium"
      >
        content
      </ModalComponent>
    </>
  );
};

export default ReusableFormModal;
