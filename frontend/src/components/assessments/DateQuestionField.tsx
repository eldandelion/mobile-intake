import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ScaleQuestion } from '../../api/intakeApi';
import {
  getDaysInMonth,
  validateBirthDate,
  MIN_STUDENT_AGE,
  MAX_STUDENT_AGE,
} from '../../domain/validators';

export interface DateQuestionFieldProps {
  readonly question: ScaleQuestion;
  readonly value?: string; // Canonical "YYYY-MM-DD" or undefined
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onChange: (isoDate: string) => void;
  readonly onEnterPress?: () => void;
}

const MONTH_OPTIONS = [
  { value: '1', label: '1月' },
  { value: '2', label: '2月' },
  { value: '3', label: '3月' },
  { value: '4', label: '4月' },
  { value: '5', label: '5月' },
  { value: '6', label: '6月' },
  { value: '7', label: '7月' },
  { value: '8', label: '8月' },
  { value: '9', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' },
];

export const DateQuestionField: React.FC<DateQuestionFieldProps> = ({
  question,
  value,
  error: externalError,
  disabled = false,
  onChange,
  onEnterPress,
}) => {
  // Parse initial value (expected YYYY-MM-DD)
  const parsedParts = useMemo(() => {
    if (!value || typeof value !== 'string') return { y: '', m: '', d: '' };
    const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(value.trim());
    if (match) {
      return {
        y: match[1],
        m: String(parseInt(match[2], 10)),
        d: String(parseInt(match[3], 10)),
      };
    }
    return { y: '', m: '', d: '' };
  }, [value]);

  const [month, setMonth] = useState<string>(parsedParts.m);
  const [day, setDay] = useState<string>(parsedParts.d);
  const [year, setYear] = useState<string>(parsedParts.y);
  const [internalError, setInternalError] = useState<string>('');

  const lastQuestionIdRef = useRef(question.id);
  const lastEmittedValueRef = useRef(value);

  // Synchronize when question changes or external value is provided
  useEffect(() => {
    // If navigating to a different question, re-sync completely
    if (lastQuestionIdRef.current !== question.id) {
      lastQuestionIdRef.current = question.id;
      lastEmittedValueRef.current = value;
      setMonth(parsedParts.m);
      setDay(parsedParts.d);
      setYear(parsedParts.y);
      setInternalError('');
      return;
    }

    // If external value changed from outside (e.g. draft hydrated from server)
    if (value !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = value;
      // If external value is a non-empty ISO date, update fields
      if (parsedParts.y || parsedParts.m || parsedParts.d) {
        setMonth(parsedParts.m);
        setDay(parsedParts.d);
        setYear(parsedParts.y);
        setInternalError('');
      }
    }
  }, [question.id, value, parsedParts]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const minYear = currentYear - MAX_STUDENT_AGE;
  const maxYear = currentYear - MIN_STUDENT_AGE;

  const maxDays = useMemo(() => {
    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    if (!isNaN(yNum) && !isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      return getDaysInMonth(yNum, mNum);
    }
    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
      return getDaysInMonth(2024, mNum);
    }
    return 31;
  }, [year, month]);

  // Emit formatted ISO date when all 3 fields are non-empty
  const triggerChange = useCallback(
    (newY: string, newM: string, newD: string) => {
      if (!newY.trim() || !newM.trim() || !newD.trim()) {
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }

      const yNum = parseInt(newY, 10);
      const mNum = parseInt(newM, 10);
      const dNum = parseInt(newD, 10);

      if (isNaN(yNum) || isNaN(mNum) || isNaN(dNum)) {
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }

      const maxAllowed = getDaysInMonth(yNum, mNum);
      if (dNum > maxAllowed) {
        setInternalError(`该月最大天数为 ${maxAllowed} 日`);
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }

      const formatted = `${newY.padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      const validation = validateBirthDate(formatted);
      if (!validation.isValid) {
        setInternalError(validation.error || '出生日期不合法');
      } else {
        setInternalError('');
      }

      lastEmittedValueRef.current = formatted;
      onChange(formatted);
    },
    [onChange]
  );

  const handleMonthChange = (val: string) => {
    setMonth(val);
    setInternalError('');

    // If day exceeds new month's max days, flag it
    const yNum = parseInt(year, 10);
    const mNum = parseInt(val, 10);
    const dNum = parseInt(day, 10);
    if (!isNaN(yNum) && !isNaN(mNum) && !isNaN(dNum)) {
      const allowed = getDaysInMonth(yNum, mNum);
      if (dNum > allowed) {
        setInternalError(`该月最大天数为 ${allowed} 日`);
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }
    }

    triggerChange(year, val, day);
  };

  const handleDayInput = (val: string) => {
    // Strip non-digits
    const cleanVal = val.replace(/\D/g, '');
    setDay(cleanVal);
    setInternalError('');

    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(cleanVal, 10);
    if (!isNaN(yNum) && !isNaN(mNum) && !isNaN(dNum)) {
      const allowed = getDaysInMonth(yNum, mNum);
      if (dNum > allowed) {
        setInternalError(`该月最大天数为 ${allowed} 日`);
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }
    }

    triggerChange(year, month, cleanVal);
  };

  const handleYearInput = (val: string) => {
    // Strip non-digits
    const cleanVal = val.replace(/\D/g, '');
    setYear(cleanVal);
    setInternalError('');

    const yNum = parseInt(cleanVal, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (!isNaN(yNum) && !isNaN(mNum) && !isNaN(dNum)) {
      const allowed = getDaysInMonth(yNum, mNum);
      if (dNum > allowed) {
        setInternalError(`该月最大天数为 ${allowed} 日`);
        lastEmittedValueRef.current = '';
        onChange('');
        return;
      }
    }

    triggerChange(cleanVal, month, day);
  };

  // Only show error if the user has interacted with the component or internal validation failed
  const isTouched = Boolean(year || month || day);
  const displayError = internalError || (isTouched && externalError ? externalError : '');
  const hasError = Boolean(displayError);

  return (
    <div className="space-y-3 pt-2">
      {/* 3-Column Responsive Date Input Grid (Option B Layout) */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {/* 1. Month Dropdown */}
        <div className="min-w-0 w-full">
          <md-outlined-select
            label="月"
            className="w-full min-w-0"
            style={{
              minWidth: 0,
              width: '100%',
              '--md-outlined-select-text-field-container-shape': 'var(--md-outlined-text-field-container-shape, 4px)',
            } as React.CSSProperties}
            value={month}
            disabled={disabled || undefined}
            error={hasError || undefined}
            onChange={(e: any) => {
              handleMonthChange(e.target.value);
            }}
          >
            {MONTH_OPTIONS.map((m) => (
              <md-select-option key={m.value} value={m.value}>
                <div slot="headline">{m.label}</div>
              </md-select-option>
            ))}
          </md-outlined-select>
        </div>

        {/* 2. Day Number Input */}
        <div className="min-w-0 w-full">
          <md-outlined-text-field
            label="日"
            type="number"
            min="1"
            max={String(maxDays)}
            inputmode="numeric"
            className="w-full min-w-0"
            style={{ minWidth: 0, width: '100%' } as React.CSSProperties}
            value={day}
            disabled={disabled || undefined}
            error={hasError || undefined}
            onInput={(e: any) => {
              handleDayInput(e.target.value);
            }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' && onEnterPress) {
                onEnterPress();
              }
            }}
          />
        </div>

        {/* 3. Year Number Input */}
        <div className="min-w-0 w-full">
          <md-outlined-text-field
            label="年"
            type="number"
            min={String(minYear)}
            max={String(maxYear)}
            inputmode="numeric"
            className="w-full min-w-0"
            style={{ minWidth: 0, width: '100%' } as React.CSSProperties}
            value={year}
            disabled={disabled || undefined}
            error={hasError || undefined}
            onInput={(e: any) => {
              handleYearInput(e.target.value);
            }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' && onEnterPress) {
                onEnterPress();
              }
            }}
          />
        </div>
      </div>

      {/* Inline Error Display - only shown when there's an active error after interaction */}
      {hasError && displayError && (
        <div
          className="text-xs text-[var(--md-sys-color-error)] flex items-center gap-1 pt-1"
          role="alert"
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{displayError}</span>
        </div>
      )}

      {/* Supporting Guidance Text */}
      <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] pt-0.5">
        请选择出生月份，并填写出生日与出生年份（适用年龄范围：{MIN_STUDENT_AGE}–{MAX_STUDENT_AGE} 周岁）
      </div>
    </div>
  );
};
