import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  className?: string;
};

export function NumberInput({
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
  className,
}: Props) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <input
      className={className}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        onChange(next);
      }}
      placeholder={placeholder}
      type="text"
      inputMode={inputMode}
    />
  );
}
