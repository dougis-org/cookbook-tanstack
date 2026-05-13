// FormInput — labelled text input with optional error message.
// Source: src/components/ui/FormInput.tsx
function FormInput({ id, label, type = "text", value, onChange, placeholder, required, error }) {
  return (
    <div className="cb-field">
      <label htmlFor={id} className="cb-field-label">
        {label}
        {required && <span className="cb-field-required"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`cb-input ${error ? "cb-input--error" : ""}`}
      />
      {error && <p id={`${id}-error`} className="cb-field-error">{error}</p>}
    </div>
  );
}

window.FormInput = FormInput;
