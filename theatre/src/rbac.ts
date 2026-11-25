// Roles & permissions (wiki docs §7–§9). Pure functions over plain data, so the rules are unit tested in isolation.
// The Screen DO is the only enforcer; clients just display what the theatre computes.

export const PERMISSIONS = [
  "playback.toggle",
  "playback.seek",
  "playback.skip",
  "playlist.add",
  "playlist.add_external",
  "playlist.remove",
  "playlist.reorder",
  "subtitles.share",
  "screen.ready_check",
  "screen.settings",
  "screen.invite",
  "chat.send",
  "chat.gif",
  "chat.react",
  "viewers.mute",
  "viewers.kick",
  "viewers.ban",
  "roles.assign",
  "roles.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const isPermission = (v: unknown): v is Permission => PERMISSIONS.includes(v as Permission);

/** Ranks. The host is implicit (owner token); co-host and viewer are built-in roles; custom roles sit in between. */
export const RANK = { host: 1000, cohost: 900, customMax: 899, customMin: 1, viewer: 0 } as const;

export const COHOST_ROLE = "cohost";
export const VIEWER_ROLE = "viewer";
export const MAX_CUSTOM_ROLES = 20;

export interface Role {
  id: string;
  name: string;
  /** "#rrggbb" or null. */
  colour: string | null;
  position: number;
  permissions: Permission[];
  builtin: boolean;
}

/** Everything the screen remembers about a viewer (keyed by token hash), online or not. */
export interface Member {
  name: string;
  device: string;
  /** Custom role ids. Co-host comes from the screen's co-host list; everyone has the viewer role. */
  roles: string[];
  allow: Permission[];
  deny: Permission[];
  muted: boolean;
}

export function defaultRoles(): Role[] {
  return [
    { id: COHOST_ROLE, name: "Co-host", colour: "#e8a33d", position: RANK.cohost, permissions: [...PERMISSIONS], builtin: true },
    {
      id: VIEWER_ROLE,
      name: "Viewer",
      colour: null,
      position: RANK.viewer,
      permissions: ["chat.send", "chat.gif", "chat.react"],
      builtin: true,
    },
  ];
}

export function newMember(name: string, device: string): Member {
  return { name, device, roles: [], allow: [], deny: [], muted: false };
}

/** Who someone is in a screen, as far as permissions are concerned. */
export interface Subject {
  isOwner: boolean;
  /** Highest-priority co-host present while the host is away (§7.2). */
  isActingHost: boolean;
  isCoHost: boolean;
  member: Member;
}

export function rolesOf(s: Subject, roles: Role[]): Role[] {
  return roles.filter((r) => r.id === VIEWER_ROLE || (r.id === COHOST_ROLE && s.isCoHost) || (!r.builtin && s.member.roles.includes(r.id)));
}

/** Highest rank: host 1000, co-host / acting host 900, else the highest custom role, else 0. */
export function rank(s: Subject, roles: Role[]): number {
  if (s.isOwner) return RANK.host;
  if (s.isCoHost || s.isActingHost) return RANK.cohost;
  return Math.max(RANK.viewer, ...rolesOf(s, roles).map((r) => r.position));
}

/** Resolution order, §8.4: host/acting host → per-viewer deny → per-viewer allow → any role → deny. */
export function can(s: Subject, p: Permission, roles: Role[]): boolean {
  if (s.isOwner || s.isActingHost) return true;
  if (s.member.deny.includes(p)) return false;
  if (s.member.allow.includes(p)) return true;
  return rolesOf(s, roles).some((r) => r.permissions.includes(p));
}

export function effective(s: Subject, roles: Role[]): Permission[] {
  return PERMISSIONS.filter((p) => can(s, p, roles));
}

/** Strictly-below rule for managing other viewers (§8.2). */
export function outranks(actor: Subject, target: Subject, roles: Role[]): boolean {
  return rank(actor, roles) > rank(target, roles);
}

/** You can't hand out permissions you don't have yourself. */
export function missingPermissions(actor: Subject, wanted: Permission[], roles: Role[]): Permission[] {
  const mine = new Set(effective(actor, roles));
  return wanted.filter((p) => !mine.has(p));
}

export const uniquePermissions = (ps: Permission[]): Permission[] => PERMISSIONS.filter((p) => ps.includes(p));

/** Default position for a role created by someone of rank `actorRank`: just above the highest custom role they can manage. */
export function defaultPosition(actorRank: number, roles: Role[]): number {
  const below = roles.filter((r) => !r.builtin && r.position < actorRank).map((r) => r.position);
  const pos = below.length ? Math.max(...below) + 1 : RANK.customMin;
  return Math.min(pos, actorRank - 1, RANK.customMax);
}
