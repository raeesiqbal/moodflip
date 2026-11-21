-- The initial migration installs a trigger for future sign-ups. This one-time
-- backfill links Auth users that already existed before the trigger was added.
insert into public.profiles (id, email, name, created_at)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name', u.created_at
from auth.users as u
where u.email is not null
on conflict (id) do nothing;
