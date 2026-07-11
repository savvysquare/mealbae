import { createClient } from '@supabase/supabase-js';

const oldUrl = 'https://fpnuckewxvxfftbeutsr.supabase.co';
const oldAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbnVja2V3eHZ4ZmZ0YmV1dHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MTQ2NjAsImV4cCI6MjA5OTI5MDY2MH0.dAL5SWRddmmJZVKXnSCtdKF36KHAKipsHmz9ipphBk4';

const newUrl = 'https://cnxrrucvapuuirphwxuu.supabase.co';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueHJydWN2YXB1dWlycGh3eHV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2Nzg4NSwiZXhwIjoyMDk5MzQzODg1fQ.ufj5P4t_wU-mhL_6NciEL_LNOtlgF6NZ3iIxCZEtKfg';

const oldClient = createClient(oldUrl, oldAnonKey);
const newClient = createClient(newUrl, newServiceKey);

async function run() {
  console.log("Fetching restaurants from old DB...");
  const { data: restaurants, error: restErr } = await oldClient.from('restaurants').select('*');
  if (restErr) {
    console.error("Error fetching restaurants:", restErr);
    return;
  }
  console.log(`Found ${restaurants.length} restaurants.`);

  console.log("Fetching menu categories from old DB...");
  const { data: categories, error: catErr } = await oldClient.from('menu_categories').select('*');
  if (catErr) {
    console.error("Error fetching categories:", catErr);
    return;
  }
  console.log(`Found ${categories.length} categories.`);

  console.log("Fetching meals from old DB...");
  const { data: meals, error: mealErr } = await oldClient.from('meals').select('*');
  if (mealErr) {
    console.error("Error fetching meals:", mealErr);
    return;
  }
  console.log(`Found ${meals.length} meals.`);

  // Clear existing items in new DB (to avoid duplicates or conflicts)
  console.log("Cleaning up new DB...");
  await newClient.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await newClient.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await newClient.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert restaurants
  console.log("Inserting restaurants into new DB...");
  if (restaurants.length > 0) {
    const { error: insRestErr } = await newClient.from('restaurants').insert(restaurants);
    if (insRestErr) {
      console.error("Error inserting restaurants:", insRestErr);
      return;
    }
  }

  // Insert categories
  console.log("Inserting categories into new DB...");
  if (categories.length > 0) {
    const { error: insCatErr } = await newClient.from('menu_categories').insert(categories);
    if (insCatErr) {
      console.error("Error inserting categories:", insCatErr);
      return;
    }
  }

  // Insert meals
  console.log("Inserting meals into new DB...");
  if (meals.length > 0) {
    const { error: insMealErr } = await newClient.from('meals').insert(meals);
    if (insMealErr) {
      console.error("Error inserting meals:", insMealErr);
      return;
    }
  }

  console.log("Data sync completed successfully!");
}

run();
