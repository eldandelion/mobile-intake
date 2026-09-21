/**
 * Frontend Domain Value Specifications & Validation Contracts.
 * Strictly mirrors backend domain rules from DomainValues.kt and ScaleResponseSet.kt.
 * Zero-dependency, pure functions designed for React 19 state and Material Design 3.
 */

export interface ValidationResult<T = string> {
  readonly isValid: boolean;
  readonly error?: string;
  readonly normalized?: T;
}

// ---------------------------------------------------------------------------
// 1. Student Number Specification
// Valid formats:
// - Domestic Undergraduate: 10 digits starting with 1-9 (e.g. 8209220532)
// - Domestic Postgraduate: 9 digits starting with 1-9 (e.g. 264718003)
// - International Student: 'L' or 'l' followed by 9 digits starting with 1-9 (e.g. L209220532)
// Anti-degeneracy: digits cannot all be identical (e.g. 9999999999, L999999999).
// ---------------------------------------------------------------------------
const STUDENT_NUM_PATTERN = /^([1-9]\d{8,9}|[Ll][1-9]\d{8})$/;
const INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function validateStudentNumber(raw?: string | null): ValidationResult<string> {
  if (!raw || !raw.trim()) {
    return { isValid: false, error: '请输入您的学号' };
  }
  const trimmed = raw.trim();
  if (INJECTION_PREFIXES.some((ch) => raw.startsWith(ch) || trimmed.startsWith(ch))) {
    return { isValid: false, error: '学号不能包含公式或特殊计算符号' };
  }
  if (!STUDENT_NUM_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: '学号格式不正确（本科生10位数字、研究生9位数字，留学生以L开头加9位数字，首位非0）',
    };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (new Set(digits).size <= 1) {
    return { isValid: false, error: '学号不能为全重复数字' };
  }
  return { isValid: true, normalized: trimmed.toUpperCase() };
}

// ---------------------------------------------------------------------------
// 2. Chinese Mobile Number Specification
// ---------------------------------------------------------------------------
const CHINESE_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

export function validateChineseMobile(raw?: string | null): ValidationResult<string> {
  if (!raw || !raw.trim()) {
    return { isValid: false, error: '请输入正确的11位手机号码' };
  }
  const trimmed = raw.trim();
  if (!CHINESE_MOBILE_PATTERN.test(trimmed)) {
    return { isValid: false, error: '请输入正确的11位中国大陆手机号码' };
  }
  return { isValid: true, normalized: trimmed };
}

// ---------------------------------------------------------------------------
// 3. Person Name Specification
// ---------------------------------------------------------------------------
const CHINESE_NAME_PATTERN = /^[\u4e00-\u9fa5·•]{2,32}$/;
const LATIN_NAME_PATTERN = /^[A-Za-z\s.'\-]{2,64}$/;

export function validatePersonName(raw?: string | null): ValidationResult<string> {
  if (!raw || !raw.trim()) {
    return { isValid: false, error: '请输入您的真实姓名' };
  }
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 64) {
    return { isValid: false, error: '姓名长度须在 2 至 64 个字符之间' };
  }
  if (!CHINESE_NAME_PATTERN.test(trimmed) && !LATIN_NAME_PATTERN.test(trimmed)) {
    return { isValid: false, error: '姓名仅支持汉字、少数民族间隔符或标准英文字符' };
  }
  return { isValid: true, normalized: trimmed };
}

// ---------------------------------------------------------------------------
// 4. Chinese National ID Card Specification (GB 11643-1999 & ISO 7064:1983.MOD 11-2)
// ---------------------------------------------------------------------------
const ID_CARD_PATTERN = /^(\d{6})(19|20)(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(\d{3})([0-9Xx])$/;
const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

export function validateIdCardNumber(raw?: string | null): ValidationResult<string> {
  if (!raw || !raw.trim()) {
    return { isValid: false, error: '请输入18位二代身份证号码' };
  }
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(ID_CARD_PATTERN);
  if (!match) {
    return { isValid: false, error: '身份证号码格式不正确（须为18位且符合编码规则）' };
  }

  // Verify calendar birth date
  const year = parseInt(`${match[2]}${match[3]}`, 10);
  const month = parseInt(match[4], 10);
  const day = parseInt(match[5], 10);
  const dateObj = new Date(year, month - 1, day);

  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() + 1 !== month ||
    dateObj.getDate() !== day ||
    dateObj > new Date()
  ) {
    return { isValid: false, error: '身份证包含无效的出生年月日' };
  }

  // Calculate ISO 7064 MOD 11-2 check code
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(trimmed[i], 10) * ID_WEIGHTS[i];
  }
  const expectedCheckCode = ID_CHECK_CODES[sum % 11];
  if (trimmed[17] !== expectedCheckCode) {
    return { isValid: false, error: '身份证校验码错误，请核对最后一位' };
  }

  return { isValid: true, normalized: trimmed };
}

// ---------------------------------------------------------------------------
// 5. Email Address Specification (RFC 5322 simplified)
// ---------------------------------------------------------------------------
const EMAIL_PATTERN = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export function validateEmailAddress(raw?: string | null): ValidationResult<string> {
  if (!raw || !raw.trim()) {
    return { isValid: false, error: '请输入电子邮箱' };
  }
  const trimmed = raw.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { isValid: false, error: '请输入有效的电子邮箱地址' };
  }
  return { isValid: true, normalized: trimmed.toLowerCase() };
}

// ---------------------------------------------------------------------------
// 6. Questionnaire Question & Scale Response Specification
// ---------------------------------------------------------------------------
export interface QuestionValidationContext {
  readonly id: string;
  readonly field?: string | null;
  readonly type: string;
  readonly text: string;
  readonly min?: number | null;
  readonly max?: number | null;
  readonly step?: number | null;
  readonly unit?: string | null;
  readonly options?: Array<{ value: any; label?: string; hasTextInput?: boolean }>;
  readonly zeroOptionLabel?: string | null;
}

export function validateQuestionAnswer(
  q: QuestionValidationContext,
  value: unknown
): ValidationResult<unknown> {
  // 1. Empty check
  if (value === undefined || value === null || value === '') {
    return { isValid: false, error: '请完成本道题目作答' };
  }

  // 2. Multiple Choice validation
  if (q.type === 'multiple_choice') {
    if (!Array.isArray(value) || value.length === 0) {
      return { isValid: false, error: '多选题至少选择一项' };
    }
    // Verify any selected option requiring text input
    for (const item of value) {
      if (item && typeof item === 'object') {
        const itemVal = item.value;
        const itemText = item.text;
        const matched = q.options?.find((o) => String(o.value) === String(itemVal));
        if (matched?.hasTextInput && (!itemText || !String(itemText).trim())) {
          return { isValid: false, error: '请补充填写具体说明' };
        }
      }
    }
    return { isValid: true, normalized: value };
  }

  // 3. Number / Slider validation
  if (q.type === 'number' || q.type === 'slider' || q.min != null || q.max != null) {
    if ((q.zeroOptionLabel || q.id === 'G17a') && (value === 0 || value === '0')) {
      return { isValid: true, normalized: 0 };
    }
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num)) {
      return { isValid: false, error: '请输入有效的数值' };
    }
    if (q.min != null && num < q.min) {
      return { isValid: false, error: `输入数值不能小于 ${q.min}` };
    }
    if (q.max != null && num > q.max) {
      return { isValid: false, error: `输入数值不能大于 ${q.max}` };
    }
    return { isValid: true, normalized: num };
  }

  // 4. Single choice with text input
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const valObj = value as { value: any; text?: string };
    const matchedOpt = q.options?.find((o) => String(o.value) === String(valObj.value));
    if (matchedOpt?.hasTextInput && (!valObj.text || !valObj.text.trim())) {
      return { isValid: false, error: '请补充填写具体说明' };
    }
    return { isValid: true, normalized: valObj };
  }

  // 5. Text inputs mapped to demographic domain concepts
  if (q.type === 'text') {
    const textVal = String(value).trim();
    if (!textVal) {
      return { isValid: false, error: '内容不能为空' };
    }

    const fieldKey = (q.field || q.id).toLowerCase();
    if (fieldKey.includes('idcard') || fieldKey.includes('id_card')) {
      return validateIdCardNumber(textVal);
    }
    if (fieldKey.includes('phone') || fieldKey.includes('mobile')) {
      return validateChineseMobile(textVal);
    }
    if (fieldKey.includes('student_number') || fieldKey.includes('studentno') || fieldKey === 'studentnumber') {
      return validateStudentNumber(textVal);
    }
    if (fieldKey.includes('email') || fieldKey.includes('mail')) {
      return validateEmailAddress(textVal);
    }
    if (fieldKey.includes('name') && !fieldKey.includes('section')) {
      return validatePersonName(textVal);
    }

    if (textVal.length > 200) {
      return { isValid: false, error: '输入内容超出最大字数限制' };
    }
    return { isValid: true, normalized: textVal };
  }

  return { isValid: true, normalized: value };
}
