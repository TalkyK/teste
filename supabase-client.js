const viteEnv = import.meta.env || {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL || window.__SUPABASE_URL__ || '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__ || '';

export const supabase = supabaseUrl && supabaseAnonKey ? { url: supabaseUrl, anonKey: supabaseAnonKey } : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  }
  return supabase;
}

async function request(path, options = {}) {
  const client = requireSupabase();
  const response = await fetch(`${client.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: client.anonKey,
      Authorization: `Bearer ${client.anonKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase respondeu com HTTP ${response.status}.`);
  }
  return response.status === 204 ? null : response.json();
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
  const [businesses, interactions] = await Promise.all([
    request('businesses?select=*&order=created_at.desc'),
    request('business_interactions?select=business_id,type'),
  ]);
  return (businesses || []).map((business) => toBusiness(business, interactions || []));
}

export async function upsertBusiness(business) {
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
  const [data] = await request('businesses?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ ...record, updated_at: new Date().toISOString() }),
  });
  return toBusiness(data, []);
}

export async function addInteraction(businessId, type) {
  await request('business_interactions', {
    method: 'POST',
    body: JSON.stringify({
      business_id: businessId,
      type,
    }),
  });
}
