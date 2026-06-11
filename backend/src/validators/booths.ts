import { BoothInput, BoothStatus, BoothTagInput, InspectionRecordInput, InspectionRecordUpdateInput } from "../types";

const VALID_STATUSES: BoothStatus[] = ["available", "damaged", "demolished"];

interface TextFieldOptions {
  required?: boolean;
  requiredMsg?: string;
  maxLength?: number;
  label: string;
}

interface TextFieldResult {
  sanitized: string | null;
  error?: string;
}

export function validateTextField(raw: unknown, options: TextFieldOptions): TextFieldResult {
  const { required = false, requiredMsg, maxLength, label } = options;
  const isNonEmptyString = typeof raw === "string" && raw.trim().length > 0;

  if (!isNonEmptyString) {
    if (required) {
      return { sanitized: null, error: requiredMsg || `请输入${label}` };
    }
    return { sanitized: null };
  }

  const trimmed = (raw as string).trim();

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { sanitized: null, error: `${label}不能超过${maxLength}字` };
  }

  return { sanitized: trimmed };
}

type ValidationResult<T> =
  | { input: T; errors: Record<string, string> }
  | { input: null; errors: Record<string, string> };

export function validateBoothInput(body: Record<string, unknown>): ValidationResult<BoothInput> {
  const { city, address, longitude, latitude, status, discovery_date, photo_url, remark } = body;
  const errors: Record<string, string> = {};

  if (typeof city !== "string" || city.trim().length === 0) {
    errors.city = "请输入城市";
  }
  if (typeof address !== "string" || address.trim().length === 0) {
    errors.address = "请输入地址";
  }
  if (typeof longitude !== "number") {
    errors.longitude = "请输入有效经度";
  }
  if (typeof latitude !== "number") {
    errors.latitude = "请输入有效纬度";
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as BoothStatus)) {
    errors.status = "请选择有效状态";
  }
  if (typeof discovery_date !== "string" || discovery_date.trim().length === 0) {
    errors.discovery_date = "请输入发现日期";
  }

  const remarkResult = validateTextField(remark, { label: "备注", maxLength: 200 });
  if (remarkResult.error) {
    errors.remark = remarkResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      city: (city as string).trim(),
      address: (address as string).trim(),
      longitude: longitude as number,
      latitude: latitude as number,
      status: status as BoothStatus,
      discovery_date: (discovery_date as string).trim(),
      photo_url: typeof photo_url === "string" ? photo_url : "",
      remark: remarkResult.sanitized,
    },
    errors,
  };
}

function validateInspectorAndRemarks(
  inspector_name: unknown,
  remarks: unknown
): { errors: Record<string, string>; remarksSanitized: string | null } {
  const errors: Record<string, string> = {};
  if (typeof inspector_name !== "string" || inspector_name.trim().length === 0) {
    errors.inspector_name = "请输入巡检人姓名";
  }

  const remarksResult = validateTextField(remarks, {
    required: true,
    requiredMsg: "请输入备注说明",
    label: "备注",
    maxLength: 500,
  });
  if (remarksResult.error) {
    errors.remarks = remarksResult.error;
  }

  return { errors, remarksSanitized: remarksResult.sanitized };
}

export function validateInspectionInput(
  body: Record<string, unknown>,
  boothId: number
): ValidationResult<InspectionRecordInput> {
  const { inspector_name, inspection_date, remarks } = body;
  const { errors, remarksSanitized } = validateInspectorAndRemarks(inspector_name, remarks);

  if (typeof inspection_date !== "string" || inspection_date.trim().length === 0) {
    errors.inspection_date = "请选择巡检日期";
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      booth_id: boothId,
      inspector_name: (inspector_name as string).trim(),
      inspection_date: (inspection_date as string).trim(),
      remarks: remarksSanitized!,
    },
    errors,
  };
}

export function validateInspectionUpdateInput(
  body: Record<string, unknown>
): ValidationResult<InspectionRecordUpdateInput> {
  const { inspector_name, remarks } = body;
  const { errors, remarksSanitized } = validateInspectorAndRemarks(inspector_name, remarks);

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: {
      inspector_name: (inspector_name as string).trim(),
      remarks: remarksSanitized!,
    },
    errors: {},
  };
}

export function validateBoothTagInput(
  body: Record<string, unknown>
): ValidationResult<BoothTagInput> {
  const { tag_names } = body;
  const errors: Record<string, string> = {};

  if (!Array.isArray(tag_names)) {
    errors.tag_names = "tag_names 必须是字符串数组";
    return { input: null, errors };
  }

  const sanitizedNames: string[] = [];
  for (let i = 0; i < tag_names.length; i++) {
    const name = tag_names[i];
    const result = validateTextField(name, { label: `标签${i + 1}`, maxLength: 20 });
    if (result.error) {
      errors[`tag_${i}`] = result.error;
    } else if (result.sanitized !== null) {
      sanitizedNames.push(result.sanitized);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { input: null, errors };
  }

  return {
    input: { tag_names: sanitizedNames },
    errors,
  };
}
