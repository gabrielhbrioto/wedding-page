import { cookies } from "next/headers";

import GenericRsvpForm from "../../components/rsvp/GenericRsvpForm";
import TokenRsvpForm, { type MemberStatusChoice } from "../../components/rsvp/TokenRsvpForm";
import { API_URL } from "../../lib/api";
import { createClient } from "../../lib/supabase/server";

type PublicEventData = {
  confirmation_deadline_at: string | null;
  gift_list_url: string | null;
};

type SavedRsvpResponse = {
  id: string;
  mensagem: string | null;
};

type SavedRsvpMemberStatus = {
  member_id: string;
  status: MemberStatusChoice;
};

async function getPublicEvent(): Promise<PublicEventData | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/public/event`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicEventData;
  } catch {
    return null;
  }
}

export default async function RsvpPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("invite_token")?.value;
  const publicEvent = await getPublicEvent();
  const confirmationDeadlineAt = publicEvent?.confirmation_deadline_at ?? null;
  const giftListUrl = publicEvent?.gift_list_url ?? null;

  if (!token) {
    return (
      <GenericRsvpForm
        confirmationDeadlineAt={confirmationDeadlineAt}
        giftListUrl={giftListUrl}
      />
    );
  }

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("invitation_groups")
    .select("*")
    .eq("token", token)
    .single();

  if (!group) {
    return (
      <GenericRsvpForm
        confirmationDeadlineAt={confirmationDeadlineAt}
        giftListUrl={giftListUrl}
      />
    );
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", group.id)
    .order("ordem_exibicao");

  const { data: response } = await supabase
    .from("rsvp_responses")
    .select("id, mensagem")
    .eq("group_id", group.id)
    .maybeSingle<SavedRsvpResponse>();

  let initialMemberStatuses: Record<string, MemberStatusChoice> | undefined;
  if (response) {
    const { data: statusRows } = await supabase
      .from("rsvp_member_status")
      .select("member_id, status")
      .eq("response_id", response.id)
      .returns<SavedRsvpMemberStatus[]>();

    initialMemberStatuses = Object.fromEntries(
      (statusRows || []).map((statusRow) => [statusRow.member_id, statusRow.status])
    );
  }

  return (
    <TokenRsvpForm
      group={group}
      members={members || []}
      initialMemberStatuses={initialMemberStatuses}
      initialMessage={response?.mensagem ?? undefined}
      hasSavedResponse={Boolean(response)}
      confirmationDeadlineAt={confirmationDeadlineAt}
      giftListUrl={giftListUrl}
    />
  );
}
