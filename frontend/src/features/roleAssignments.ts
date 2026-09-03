import api from './axios';

export interface RoleAssignment {
  _id?: string;
  staffMemberId: string | { _id: string; firstName?: string; lastName?: string; staffId?: string };
  roleType: string;
  scopeType: string;
  scopeId?: string | { _id: string } | null;
  academicSessionId?: string | { _id: string; name?: string; code?: string } | null;
  startDate?: string;
  endDate?: string | null;
  notes?: string;
}

export interface RoleAssignmentMeta {
  roleTypes: string[];
  scopeTypes: string[];
}

class RoleAssignmentAPI {
  async list(params?: { staffMemberId?: string; scopeType?: string; roleType?: string }) {
    const res = await api.get('/role-assignments', { params });
    return (res.data?.data ?? []) as RoleAssignment[];
  }

  async getMeta() {
    const res = await api.get('/role-assignments/meta');
    return res.data?.data as RoleAssignmentMeta;
  }

  async create(payload: {
    staffMemberId: string;
    roleType: string;
    scopeType: string;
  scopeId?: string | { _id: string } | null;
    academicSessionId?: string | null;
    startDate?: string;
    endDate?: string | null;
    notes?: string;
  }) {
    const res = await api.post('/role-assignments', payload);
    return res.data?.data as RoleAssignment;
  }

  async delete(id: string) {
    const res = await api.delete(`/role-assignments/${id}`);
    return res.data;
  }
}

export const roleAssignmentAPI = new RoleAssignmentAPI();
