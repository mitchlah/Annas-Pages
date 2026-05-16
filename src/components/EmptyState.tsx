interface Props {
  icon: string;
  title: string;
  message: string;
}

export default function EmptyState({ icon, title, message }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
