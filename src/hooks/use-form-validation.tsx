import { useState, useCallback, useEffect, useRef } from "react";

type FormValue = string | number | boolean | File | null | undefined;

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: FormValue) => string | null;
}

interface ValidationSchema {
  [field: string]: ValidationRule;
}

interface UseFormValidationOptions<T extends Record<string, FormValue>> {
  schema: ValidationSchema;
  initialValues: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface FormState<T> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isValidating: boolean;
}

export function useFormValidation<T extends Record<string, FormValue>>({
  schema,
  initialValues,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {} as Record<keyof T, string | null>,
    touched: {} as Record<keyof T, boolean>,
    isValid: false,
    isValidating: false,
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const isMounted = useRef(true);

  const validateField = useCallback(
    async (field: keyof T, value: FormValue): Promise<string | null> => {
      const rule = schema[field as string];
      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (!value || (typeof value === "string" && !value.trim()))
      ) {
        return "Field ini wajib diisi";
      }

      // Skip other validations if empty and not required
      if (!value || (typeof value === "string" && !value.trim())) {
        return null;
      }

      // String validations
      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          return `Minimal ${rule.minLength} karakter`;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          return `Maksimal ${rule.maxLength} karakter`;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          return "Format tidak valid";
        }
      }

      // Custom validation
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [schema]
  );

  const validateAllFields = useCallback(
    async (values: T): Promise<Record<keyof T, string | null>> => {
      const errors: Record<keyof T, string | null> = {} as Record<
        keyof T,
        string | null
      >;

      const fieldNames = Object.keys(values) as (keyof T)[];
      for (const field of fieldNames) {
        const error = await validateField(field, values[field]);
        errors[field] = error;
      }

      return errors;
    },
    [validateField]
  );

  const setValue = useCallback(
    (field: keyof T, value: FormValue) => {
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));

      if (validateOnChange && isMounted.current) {
        // Clear existing timeout
        if (debounceTimeouts.current[field as string]) {
          clearTimeout(debounceTimeouts.current[field as string]);
        }

        // Debounce validation
        debounceTimeouts.current[field as string] = setTimeout(async () => {
          if (isMounted.current) {
            const error = await validateField(field, value);
            setFormState((prev) => {
              const newErrors = { ...prev.errors, [field]: error };
              const isValid = Object.values(newErrors).every(
                (err) => err === null
              );
              return {
                ...prev,
                errors: newErrors,
                isValid,
              };
            });
          }
        }, debounceMs);
      }
    },
    [validateField, validateOnChange, debounceMs]
  );

  const setTouched = useCallback(
    (field: keyof T, touched = true) => {
      setFormState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [field]: touched },
      }));

      if (validateOnBlur && touched && isMounted.current) {
        validateField(field, formState.values[field]).then((error) => {
          if (isMounted.current) {
            setFormState((prev) => {
              const newErrors = { ...prev.errors, [field]: error };
              const isValid = Object.values(newErrors).every(
                (err) => err === null
              );
              return {
                ...prev,
                errors: newErrors,
                isValid,
              };
            });
          }
        });
      }
    },
    [formState.values, validateField, validateOnBlur]
  );

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!isMounted.current) return false;

    setFormState((prev) => ({ ...prev, isValidating: true }));

    const errors = await validateAllFields(formState.values);
    const isValid = Object.values(errors).every((error) => error === null);

    if (isMounted.current) {
      setFormState((prev) => ({
        ...prev,
        errors,
        isValid,
        isValidating: false,
      }));
    }

    return isValid;
  }, [formState.values, validateAllFields]);

  const resetForm = useCallback(() => {
    // Clear all debounce timeouts
    Object.values(debounceTimeouts.current).forEach((timeout) => {
      clearTimeout(timeout);
    });
    debounceTimeouts.current = {};

    if (isMounted.current) {
      setFormState({
        values: initialValues,
        errors: {} as Record<keyof T, string | null>,
        touched: {} as Record<keyof T, boolean>,
        isValid: false,
        isValidating: false,
      });
    }
  }, [initialValues]);

  const setValues = useCallback((values: Partial<T>) => {
    if (isMounted.current) {
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, ...values },
      }));
    }
  }, []);

  // Initial validation on mount
  useEffect(() => {
    const runInitialValidation = async () => {
      const errors = await validateAllFields(initialValues);
      const isValid = Object.values(errors).every((error) => error === null);

      if (isMounted.current) {
        setFormState((prev) => ({
          ...prev,
          errors,
          isValid,
        }));
      }
    };

    runInitialValidation();
  }, [initialValues, validateAllFields]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      Object.values(debounceTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isValidating: formState.isValidating,
    setValue,
    setTouched,
    setValues,
    validateForm,
    resetForm,
    getFieldProps: (field: keyof T) => ({
      value: formState.values[field],
      onChange: (value: FormValue) => setValue(field, value),
      onBlur: () => setTouched(field, true),
      error: formState.touched[field] ? formState.errors[field] : null,
    }),
  };
}
