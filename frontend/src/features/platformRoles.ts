import api from './axios';

export interface PlatformRole {
  _id?: string;
  name: string;
  description?: string;
  moduleAccess: Record<string, boolean>;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformRoleMeta {
  moduleKeys: string[];
  moduleLabels: Record<string, string>;
  roleDescriptions: Record<string, string>;
  systemRoles?: string[];
}

class PlatformRoleAPI {
  async list() {
    const res = await api.get('/platform-roles');
    return (res.data?.data ?? []) as PlatformRole[];
  }

  async getById(id: string) {
    const res = await api.get(`/platform-roles/${encodeURIComponent(id)}`);
    return res.data?.data as PlatformRole;
  }

  async getMeta() {
    const res = await api.get('/platform-roles/meta');
    return res.data?.data as PlatformRoleMeta;
  }

  async create(payload: {
    name: string;
    description?: string;
    moduleAccess?: Record<string, boolean>;
  }) {
    const res = await api.post('/platform-roles', payload);
    return res.data?.data as PlatformRole;
  }

  async update(
    id: string,
    payload: { name?: string; description?: string; moduleAccess?: Record<string, boolean> }
  ) {
    const res = await api.put(`/platform-roles/${encodeURIComponent(id)}`, payload);
    return res.data?.data as PlatformRole;
  }

  async delete(id: string) {
    const res = await api.delete(`/platform-roles/${encodeURIComponent(id)}`);
    return res.data;
  }

  async reseed(mode: 'missing' | 'reset' = 'missing') {
    const res = await api.post('/platform-roles/reseed', { mode });
    return res.data as { data: PlatformRole[]; message: string; created?: number; updated?: number };
  }

  async applyToUsers(id: string) {
    const res = await api.post(`/platform-roles/${encodeURIComponent(id)}/apply-to-users`);
    return res.data as { data: { matched: number; updated: number }; message: string };
  }

  async listAuditLogs(params?: { targetType?: string; search?: string; page?: number; limit?: number }) {
    const res = await api.get('/platform-roles/audit-logs', { params });
    return res.data as {
      data: PermissionAuditLog[];
      total: number;
      count: number;
    };
  }
}

export interface PermissionAuditLog {
  _id?: string;
  action: string;
  targetType: 'role' | 'user';
  targetLabel: string;
  actorEmail?: string;
  summary?: string;
  changes?: Record<string, unknown>;
  createdAt?: string;
}

export const platformRoleAPI = new PlatformRoleAPI();

export const MODULE_GROUPS = [
  {
    label: 'Overview',
    keys: ['dashboard'],
  },
  {
    label: 'Governance',
    keys: ['governance'],
  },
  {
    label: 'Academics',
    keys: ['academic_catalog', 'academic_ops', 'assessments'],
  },
  {
    label: 'People',
    keys: ['admissions', 'students', 'staff'],
  },
  {
    label: 'Campus',
    keys: ['library', 'hostel', 'transport', 'events'],
  },
  {
    label: 'Operations',
    keys: ['finance', 'hr', 'reports', 'settings'],
  },
];
