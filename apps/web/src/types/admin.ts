export type AdminGroupType = "CERIMONIA" | "CERIMONIA_JANTAR" | "JANTAR";

export type AdminGroupRsvpStatus = "PENDENTE" | "CONFIRMADO" | "RECUSADO";

export type AdminMemberStatus =
  | "PENDENTE"
  | "CONFIRMADO"
  | "APENAS_CERIMONIA"
  | "AUSENTE";

export type AdminDashboardSummary = {
  total_groups: number;
  confirmed: number;
  pending: number;
  dinner_count: number;
  ceremony_groups: number;
  response_rate_percent: number;
};

export type AdminPresenceStats = {
  dinner_confirmed: number;
  ceremony_only: number;
  absent: number;
  total_members: number;
  responded_members: number;
  pending_members: number;
};

export type AdminRsvpListItem = {
  id: string;
  group_id: string;
  nome_grupo: string;
  mensagem?: string | null;
  total_confirmados?: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminGroupMember = {
  id: string;
  nome: string;
  status?: AdminMemberStatus;
  pre_cadastrado?: boolean;
  ordem_exibicao?: number;
  created_at?: string;
};

export type AdminGroupSummary = {
  id: string;
  token?: string | null;
  nome_grupo: string;
  tipo_convite: AdminGroupType;
  observacoes?: string | null;
  rsvp_status: AdminGroupRsvpStatus;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
  members_count?: number;
};

export type AdminGroupDetails = AdminGroupSummary & {
  members: AdminGroupMember[];
};

export type AdminEventSettings = {
  id: string;
  nome_casal: string;
  data_evento: string;
  rsvp_deadline_offset_days: number | null;
  confirmation_deadline_at?: string | null;
  local_nome?: string | null;
  endereco?: string | null;
  google_maps_url?: string | null;
  gift_list_url?: string | null;
  mensagem_home?: string | null;
  ativo?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminEventSettingsUpsertInput = {
  nome_casal: string;
  data_evento: string;
  rsvp_deadline_offset_days: number;
  local_nome?: string;
  endereco?: string;
  google_maps_url?: string;
  gift_list_url?: string | null;
  mensagem_home?: string;
  ativo?: boolean;
};

export type AdminEventSettingsMutationResponse = {
  created?: boolean;
  updated?: boolean;
  settings: AdminEventSettings;
};

export type AdminEventSettingsDeleteResponse = {
  deleted: boolean;
  id: string;
};

export type AdminCreateGroupInput = {
  token?: string;
  nome_grupo: string;
  observacoes?: string;
};

export type AdminUpdateGroupInput = Partial<AdminCreateGroupInput> & {
  tipo_convite?: AdminGroupType;
  rsvp_status?: AdminGroupRsvpStatus;
  responded_at?: string | null;
};

export type AdminGroupFormValues = {
  token: string;
  nome_grupo: string;
  observacoes: string;
  rsvp_status: AdminGroupRsvpStatus;
};

export type AdminPieChartSlice = {
  label: string;
  value: number;
  color: string;
};
