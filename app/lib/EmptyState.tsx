import React from "react";

type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function EmptyState({
  title = "Henüz kayıt bulunmuyor.",
  message = "Yeni bir kayıt eklemek için yukarıdaki butonu kullanın.",
}: EmptyStateProps) {
  return (
    <div className="isg-empty-state">
      <div className="isg-empty-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 7.5h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10.5 13h11M10.5 17h7M10.5 21h9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function EmptyTableRow({
  colSpan,
  title,
  message,
}: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td className="isg-empty-table-cell" colSpan={colSpan}>
        <EmptyState title={title} message={message} />
      </td>
    </tr>
  );
}
