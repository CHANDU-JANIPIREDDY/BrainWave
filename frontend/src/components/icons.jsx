import React from 'react';

function Svg({ children, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconPeople = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c.8-3 3-4.8 5.5-4.8S13.7 16 14.5 19" />
    <circle cx="17" cy="9" r="2.2" />
    <path d="M16.2 14.4c2 .3 3.6 1.8 4.3 4.6" />
  </Svg>
);

export const IconCrm = (props) => (
  <Svg {...props}>
    <path d="M4 18V7" />
    <path d="M10 18V4" />
    <path d="M16 18v-8" />
    <path d="M21 18H3" />
  </Svg>
);

export const IconDesk = (props) => (
  <Svg {...props}>
    <path d="M4 15a4 4 0 0 1 4-4h1v8H8a4 4 0 0 1-4-4Z" />
    <path d="M20 15a4 4 0 0 0-4-4h-1v8h1a4 4 0 0 0 4-4Z" />
    <path d="M9 11V9a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const IconBooks = (props) => (
  <Svg {...props}>
    <rect x="5" y="4" width="14" height="16" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);

export const IconAdmin = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M4.9 6.3l1.5 1.5M17.6 16.2l1.5 1.5M3 12h2M19 12h2M4.9 17.7l1.5-1.5M17.6 7.8l1.5-1.5" />
  </Svg>
);

export const IconLogout = (props) => (
  <Svg {...props}>
    <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
    <path d="M4 12h11M12 8l4 4-4 4" />
  </Svg>
);

export const IconRefresh = (props) => (
  <Svg {...props}>
    <path d="M20 12a8 8 0 1 1-2.2-5.5" />
    <path d="M20 4v5h-5" />
  </Svg>
);

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16.5 21 21" />
  </Svg>
);

export const IconArrow = (props) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconMenu = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconInbox = (props) => (
  <Svg {...props}>
    <path d="M4 13 6 5h12l2 8v6H4v-6Z" />
    <path d="M4 13h4.2a3.8 3.8 0 0 0 7.6 0H20" />
  </Svg>
);

export const IconAlert = (props) => (
  <Svg {...props}>
    <path d="M12 4 3 19h18L12 4Z" />
    <path d="M12 10v4M12 16.5v.5" />
  </Svg>
);

export const IconCheck = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="m8.5 12.2 2.3 2.3 4.7-5" />
  </Svg>
);

export const IconUsers = (props) => (
  <Svg {...props}>
    <circle cx="8" cy="9" r="3" />
    <path d="M3.2 19c.7-3 2.8-4.6 4.8-4.6S12.1 16 12.8 19" />
    <circle cx="16.5" cy="8.5" r="2.2" />
    <path d="M15.8 14.2c1.8.3 3.2 1.7 3.9 4.3" />
  </Svg>
);

export const IconBolt = (props) => (
  <Svg {...props}>
    <path d="M13 3 5 14h7l-1 7 8-11h-7l1-7Z" />
  </Svg>
);

export const IconShield = (props) => (
  <Svg {...props}>
    <path d="M12 3 5 6v6c0 4.5 3 7.2 7 9 4-1.8 7-4.5 7-9V6l-7-3Z" />
  </Svg>
);

const SERVICE_ICONS = {
  people: IconPeople,
  crm: IconCrm,
  desk: IconDesk,
  books: IconBooks,
};

export function ServiceGlyph({ service, size = 20 }) {
  const Icon = SERVICE_ICONS[service] || IconBolt;
  return <Icon size={size} />;
}
