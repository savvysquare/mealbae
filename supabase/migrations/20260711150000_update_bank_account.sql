-- Update bank account details to correct values
UPDATE public.bank_accounts
SET
  bank_name     = 'Opay',
  account_name  = 'MealBAE',
  account_number = '8141894696'
WHERE is_active = true;
