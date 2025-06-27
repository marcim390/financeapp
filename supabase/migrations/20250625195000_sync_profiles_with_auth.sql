-- Script para garantir que todos os usuários do Auth tenham um profile correspondente
insert into profiles (id, email, full_name, plan_type, subscription_status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'free',
  'inactive'
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;

-- Opcional: criar categorias padrão para esses usuários
insert into categories (user_id, name, color, icon)
select u.id, 'Alimentação', '#ef4444', 'UtensilsCrossed' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Transporte', '#3b82f6', 'Car' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Saúde', '#10b981', 'Heart' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Entretenimento', '#f59e0b', 'Gamepad2' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Casa', '#8b5cf6', 'Home' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Educação', '#06b6d4', 'GraduationCap' from auth.users u left join profiles p on p.id = u.id where p.id is null
union all
select u.id, 'Outros', '#6b7280', 'MoreHorizontal' from auth.users u left join profiles p on p.id = u.id where p.id is null;

-- Fim do script
