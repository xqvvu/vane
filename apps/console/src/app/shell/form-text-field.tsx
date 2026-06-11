import { Input } from "#/components/ui/input.tsx";

export interface FormTextFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

export function FormTextField({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  min,
  max,
  required,
}: FormTextFieldProps) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground mb-1 block">{label}</span>
      <Input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
        required={required}
      />
    </label>
  );
}
