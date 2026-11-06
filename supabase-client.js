import { createClient } from '@supabase/supabase-js';

const viteEnv = import.meta.env || {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL || window.__SUPABASE_URL__ || '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__ || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
    client.from('business_interactions').select('business_id,type'),
  ]);
  if (businessesError) throw businessesError;
  if (interactionsError) throw interactionsError;
  return (businesses || []).map((business) => toBusiness(business, interactions || []));
}

export async function upsertBusiness(business) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('É necessário estar autenticado para salvar uma empresa.');
  const record = {
    id: business.id,
    owner_id: user.id,
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
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('businesses')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return toBusiness(data, []);
}

export async function addInteraction(businessId, type) {
  const client = requireSupabase();
  const { error } = await client.from('business_interactions').insert({ business_id: businessId, type });
  if (error) throw error;
}

export async function registerUser(email, password) {
  const client = requireSupabase();
  const redirectUrl = new URL('/htmladm.html', window.location.origin).toString();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectUrl },
  });
  if (error) throw error;
  return data;
}

export async function signInUser(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') throw error;
  return data.user;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
