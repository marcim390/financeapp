drop function if exists public.accept_couple_invitation(uuid);

create or replace function public.accept_couple_invitation(invitation_id uuid)
returns void
language plpgsql
as $$
declare
  invitation record;
  sender_plan record;
begin
  select * into invitation
  from public.invitations
  where id = invitation_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Convite não encontrado ou já utilizado';
  end if;

  select plan_type into sender_plan
  from public.profile_plans
  where id = invitation.sender_id;

  if not found then
    raise exception 'Não foi possível obter o plano do remetente';
  end if;

  update public.profiles
  set
    plan_type = sender_plan.plan_type,
    subscription_status = case when sender_plan.plan_type = 'premium' then 'active' else 'inactive' end
  where id = auth.uid();

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation_id;

  insert into public.couples (user1_id, user2_id)
  values (invitation.sender_id, auth.uid())
  on conflict do nothing;

end;
$$ security definer;
