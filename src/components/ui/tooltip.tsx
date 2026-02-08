import * as React from "react";

export const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <span title={content} className="cursor-help">
    {children}
  </span>
);
