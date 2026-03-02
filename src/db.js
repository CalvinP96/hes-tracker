import { supabase } from './supabase.js'

// ══════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════

export async function loadUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')
  if (error) { console.error('loadUsers:', error); return null; }
  return data
}

export async function saveUser(user) {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' })
    .select()
  if (error) { console.error('saveUser:', error); return null; }
  return data?.[0]
}

export async function deleteUser(id) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  if (error) { console.error('deleteUser:', error); return false; }
  return true
}

// ══════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════

export async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('loadProjects:', error); return []; }
  // Each row has id + data (jsonb). Merge id into data.
  return data.map(row => ({ ...row.data, id: row.id }))
}

export async function saveProject(project) {
  const { id, ...rest } = project
  const { error } = await supabase
    .from('projects')
    .upsert({
      id,
      data: rest,
      customer_name: project.customerName || '',
      address: project.address || '',
      current_stage: project.currentStage || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  if (error) { console.error('saveProject:', error); return false; }
  return true
}

export async function saveProjects(projects) {
  // Batch upsert all projects
  const rows = projects.map(p => ({
    id: p.id,
    data: (({ id, ...rest }) => rest)(p),
    customer_name: p.customerName || '',
    address: p.address || '',
    current_stage: p.currentStage || 0,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase
    .from('projects')
    .upsert(rows, { onConflict: 'id' })
  if (error) { console.error('saveProjects:', error); return false; }
  return true
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  if (error) { console.error('deleteProject:', error); return false; }
  return true
}

// ══════════════════════════════════════════════════════
// SESSION (browser-local only)
// ══════════════════════════════════════════════════════

export function getSession() {
  try {
    const s = localStorage.getItem('hes-session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function setSession(userId, nav) {
  try {
    if (userId) {
      const existing = getSession() || {}
      localStorage.setItem('hes-session', JSON.stringify({ ...existing, userId, ...nav }))
    } else localStorage.removeItem('hes-session')
  } catch {}
}

export function setSessionNav(nav) {
  try {
    const existing = getSession()
    if (existing) localStorage.setItem('hes-session', JSON.stringify({ ...existing, ...nav }))
  } catch {}
}
