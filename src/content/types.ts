// Rich text in these blocks supports **bold** and the icon tokens used in i18n strings
// ({s}, {f}, {a}, {s2}, {person}, {door}, …).
export type Block =
  | string
  | { h: string }
  | { list: string[] }
  | { steps: [string, string][] }
  | { defs: [string, string][] }
  | { img: string; alt: string; wide?: boolean };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

export interface RulesContent {
  sections: Section[];
  faq: FaqGroup[];
}
