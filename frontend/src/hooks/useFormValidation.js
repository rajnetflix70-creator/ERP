import { useState, useCallback } from 'react';

/**
 * Custom form validation hook with instant error feedback and required field checking
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: val }));

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  }, [values]);

  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return true;

    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      const msg = rules.message || `${fieldName.replace(/_/g, ' ')} is required`;
      setErrors((prev) => ({ ...prev, [fieldName]: msg }));
      return false;
    }

    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      const msg = rules.message || `Minimum ${rules.minLength} characters required`;
      setErrors((prev) => ({ ...prev, [fieldName]: msg }));
      return false;
    }

    if (rules.numeric && value && isNaN(Number(value))) {
      const msg = rules.message || 'Must be a valid number';
      setErrors((prev) => ({ ...prev, [fieldName]: msg }));
      return false;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      const msg = rules.message || 'Invalid format';
      setErrors((prev) => ({ ...prev, [fieldName]: msg }));
      return false;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: null }));
    return true;
  }, [validationRules]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    const missingRequired = [];

    Object.keys(validationRules).forEach((fieldName) => {
      const rules = validationRules[fieldName];
      const value = values[fieldName];

      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        const label = rules.label || fieldName.replace(/_/g, ' ');
        newErrors[fieldName] = rules.message || `${label} is required`;
        missingRequired.push(label);
        isValid = false;
      } else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        newErrors[fieldName] = rules.message || `Minimum ${rules.minLength} characters required`;
        isValid = false;
      } else if (rules.numeric && value && isNaN(Number(value))) {
        newErrors[fieldName] = rules.message || 'Must be a valid number';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return {
      isValid,
      errors: newErrors,
      missingFields: missingRequired,
      summaryMessage: missingRequired.length > 0 
        ? `Please fill required fields: ${missingRequired.join(', ')}`
        : null
    };
  }, [values, validationRules]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    resetForm
  };
};

export default useFormValidation;
