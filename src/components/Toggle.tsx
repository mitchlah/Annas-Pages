interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export default function Toggle({ checked, onChange, label }: Props) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <span className="toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-track" aria-hidden />
      </span>
    </label>
  );
}
