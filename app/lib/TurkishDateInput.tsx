import React from "react";
import { IsoTarihSecici } from "./TarihSecici";

type TurkishDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  styles: Record<string, React.CSSProperties>;
  readOnly?: boolean;
  placeholder?: string;
};

export function TurkishDateInput({
  value,
  onChange,
  styles,
  readOnly = false,
  placeholder = "Tarih seçin...",
}: TurkishDateInputProps) {
  return (
    <IsoTarihSecici
      value={value}
      onChange={onChange}
      disabled={readOnly}
      allowFuture
      placeholder={placeholder}
      styles={styles}
    />
  );
}
