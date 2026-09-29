insert into public.credit_plans (id, name, price_fcfa, credits, active)
values
  ('free', 'Gratuit', 0, 5, true),
  ('starter', 'Starter', 1000, 20, true),
  ('essentiel', 'Essentiel', 2500, 60, true),
  ('pro', 'Pro', 5000, 150, true)
on conflict (id) do update
set name = excluded.name,
    price_fcfa = excluded.price_fcfa,
    credits = excluded.credits,
    active = excluded.active;

update public.credit_plans set active = false where id = 'standard';

insert into public.ai_operation_costs (operation, credits)
values
  ('AI_QUOTE_FROM_IMAGE', 2),
  ('AI_INVOICE_FROM_IMAGE', 2),
  ('AI_ARTICLE_FROM_IMAGE', 1),
  ('AI_VOICE_COMMAND', 1),
  ('AI_OCR_ANALYSIS', 2)
on conflict (operation) do update set credits = excluded.credits, updated_at = now();
