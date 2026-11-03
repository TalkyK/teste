import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  }
  return supabase;
}

function toBusiness(row, interactions = []) {
  const counts = interactions
    .filter((interaction) => interaction.business_id === row.id)
    .reduce((result, interaction) => {
      result[interaction.type] = (result[interaction.type] || 0) + 1;
      return result;
    }, {});
  return { ...row, interactions: counts };
}

export async function fetchBusinesses() {
  const client = requireSupabase();
  const [{ data: businesses, error: businessesError }, { data: interactions, error: interactionsError }] = await Promise.all([
    client.from('businesses').select('*').order('created_at', { ascending: false }),
    client.from('business_interactions').select('business_id, type'),
  ]);
  if (businessesError) throw businessesError;
  if (interactionsError) throw interactionsError;
  return (businesses || []).map((business) => toBusiness(business, interactions || []));
}

export async function upsertBusiness(business) {
  const client = requireSupabase();
  const record = {
    id: business.id,
    name: business.name,
    category: business.category,
    description: business.description,
    location: business.location,
    hours: business.hours || null,
    whatsapp: business.whatsapp || null,
    instagram: business.instagram || null,
    map: business.map || null,
    order: business.order || null,
    logo: business.logo || null,
    cover: business.cover || null,
    status: business.status,
    created_at: business.createdAt || business.created_at || new Date().toISOString(),
  };
  const { data, error } = await client.from('businesses').upsert({
    ...record,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return toBusiness(data, []);
}

export async function addInteraction(businessId, type) {
  const client = requireSupabase();
  const { error } = await client.from('business_interactions').insert({
    business_id: businessId,
    type,
  });
  if (error) throw error;
}
