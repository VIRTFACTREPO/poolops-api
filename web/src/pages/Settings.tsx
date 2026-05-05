import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

type Tab = 'Company' | 'Chemicals' | 'Target ranges' | 'Report branding' | 'Billing'

type BillingStatus = {
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  trial_days_remaining: number | null
  trial_ends_at: string | null
  plan: string
}

type CompanySettings = { name: string; email: string; phone: string | null }
type Chemical = { id: string; name: string; unit: 'L' | 'kg' | 'g' | 'tabs' }
type Targets = { ph_min: number; ph_max: number; chlorine_min: number; chlorine_max: number; lsi_min: number; lsi_max: number }
type Branding = { logo_on_pdf: boolean; show_tech_name: boolean; show_dosage: boolean; show_lsi: boolean; footer_note: string; primary_colour: string }

const CHEMICAL_SUGGESTIONS = [
  'Liquid chlorine', 'Granular chlorine', 'Muriatic acid', 'Sodium bicarbonate', 'Cyanuric acid',
  'Calcium hypochlorite', 'Algaecide', 'Clarifier', 'Phosphate remover', 'Salt',
]

export default function Settings() {
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'Company'
  const [tab, setTab] = useState<Tab>(
    (['Company', 'Chemicals', 'Target ranges', 'Report branding', 'Billing'] as Tab[]).includes(initialTab as Tab)
      ? initialTab as Tab
      : 'Company'
  )

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['Company', 'Chemicals', 'Target ranges', 'Report branding', 'Billing'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#111827' : '#F9FAFB', color: tab === t ? '#FFFFFF' : '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20 }}>
        {tab === 'Company' && <CompanyTab />}
        {tab === 'Chemicals' && <ChemicalsTab />}
        {tab === 'Target ranges' && <TargetsTab />}
        {tab === 'Report branding' && <BrandingTab />}
        {tab === 'Billing' && <BillingTab />}
      </div>
    </div>
  )
}

function CompanyTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<CompanySettings>({ name: '', email: '', phone: '' })
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    api.get<CompanySettings>('/admin/settings/company')
      .then((d) => {
        setData(d)
        setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '' })
      })
      .catch((e) => setError(e.message || 'Failed to load company settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setError(''); setMsg('')
    try {
      const updated = await api.patch<CompanySettings>('/admin/settings/company', { name: form.name, phone: form.phone })
      setData(updated)
      setForm({ name: updated.name || '', email: updated.email || '', phone: updated.phone || '' })
      setEditing(false)
      setMsg('Company settings saved')
    } catch (e: any) {
      setError(e.message || 'Failed to save company settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading company settings…</div>

  return (
    <Section title='Company'>
      {editing ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <Labeled label='Company name'><input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Labeled>
          <Labeled label='Support email'><input style={{ ...inputStyle, background: '#F3F4F6' }} disabled value={form.email} /><small style={{ color: '#6B7280' }}>Email cannot be changed here</small></Labeled>
          <Labeled label='Phone'><input style={inputStyle} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Labeled>
          {error && <div style={{ color: '#DC2626', fontSize: 12 }}>{error}</div>}
          {msg && <div style={{ color: '#15803D', fontSize: 12 }}>{msg}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button style={secondaryBtn} onClick={() => { setEditing(false); setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' }); setError('') }}>Cancel</button>
            <button style={primaryBtn} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}><button style={primaryBtn} onClick={() => setEditing(true)}>Edit</button></div>
          <Field label='Company name' value={data.name} />
          <Field label='Support email' value={data.email} />
          <Field label='Phone' value={data.phone || '—'} />
          {msg && <div style={{ color: '#15803D', fontSize: 12, marginTop: 8 }}>{msg}</div>}
        </>
      )}
    </Section>
  )
}

function ChemicalsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [chemicals, setChemicals] = useState<Chemical[]>([])
  const [newRow, setNewRow] = useState(false)
  const [draft, setDraft] = useState<Chemical>({ id: '', name: '', unit: 'L' })

  useEffect(() => {
    api.get<Chemical[]>('/admin/settings/chemicals')
      .then((d) => setChemicals(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message || 'Failed to load chemicals'))
      .finally(() => setLoading(false))
  }, [])

  const persist = async (next: Chemical[]) => {
    setSaving(true); setError('')
    try {
      const updated = await api.patch<Chemical[]>('/admin/settings/chemicals', { chemicals: next })
      setChemicals(Array.isArray(updated) ? updated : next)
      return true
    } catch (e: any) {
      setError(e.message || 'Failed to save chemicals')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading chemicals…</div>

  return (
    <Section title='Chemicals'>
      <datalist id='chemical-suggestions'>{CHEMICAL_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
      <div style={{ display: 'grid', gap: 8 }}>
        {chemicals.map((c) => (
          <div key={c.id} style={rowBox}>
            <div style={{ fontSize: 13, color: '#111827' }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{c.unit}</span>
              <button onClick={() => persist(chemicals.filter((x) => x.id !== c.id))} disabled={saving} style={xBtn}>×</button>
            </div>
          </div>
        ))}

        {newRow ? (
          <div style={rowBox}>
            <input list='chemical-suggestions' placeholder='Chemical name' style={{ ...inputStyle, margin: 0 }} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select style={selectStyle} value={draft.unit} onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value as Chemical['unit'] }))}>
                <option value='L'>L</option><option value='kg'>kg</option><option value='g'>g</option><option value='tabs'>tabs</option>
              </select>
              <button style={secondaryBtn} onClick={() => { setNewRow(false); setDraft({ id: '', name: '', unit: 'L' }) }}>Cancel</button>
              <button style={primaryBtn} disabled={saving || !draft.name.trim()} onClick={async () => {
                const next = [...chemicals, { ...draft, id: `chem-${Date.now()}` }]
                const ok = await persist(next)
                if (ok) { setNewRow(false); setDraft({ id: '', name: '', unit: 'L' }) }
              }}>Save</button>
            </div>
          </div>
        ) : (
          <button style={secondaryBtn} onClick={() => setNewRow(true)}>New chemical</button>
        )}
      </div>
      {error && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</div>}
    </Section>
  )
}

function TargetsTab() {
  const defaults: Targets = { ph_min: 7.2, ph_max: 7.6, chlorine_min: 1.0, chlorine_max: 3.0, lsi_min: -0.5, lsi_max: 0.5 }
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Targets>(defaults)
  const [form, setForm] = useState<Targets>(defaults)

  useEffect(() => {
    api.get<Targets>('/admin/settings/targets')
      .then((d) => { setData(d || defaults); setForm(d || defaults) })
      .catch((e) => setError(e.message || 'Failed to load target ranges'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setError('')
    try {
      const updated = await api.patch<Targets>('/admin/settings/targets', form)
      setData(updated)
      setForm(updated)
      setEditing(false)
    } catch (e: any) {
      setError(e.message || 'Failed to save target ranges')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading target ranges…</div>

  return (
    <Section title='Target ranges'>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        {editing ? (
          <>
            <button style={secondaryBtn} onClick={() => { setEditing(false); setForm(data) }}>Cancel</button>
            <button style={{ ...primaryBtn, marginLeft: 8 }} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        ) : <button style={primaryBtn} onClick={() => setEditing(true)}>Edit</button>}
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <RangeInput label='pH' a={form.ph_min} b={form.ph_max} onA={(v) => setForm((f) => ({ ...f, ph_min: v }))} onB={(v) => setForm((f) => ({ ...f, ph_max: v }))} step={0.1} />
          <RangeInput label='Free chlorine (ppm)' a={form.chlorine_min} b={form.chlorine_max} onA={(v) => setForm((f) => ({ ...f, chlorine_min: v }))} onB={(v) => setForm((f) => ({ ...f, chlorine_max: v }))} step={0.1} />
          <RangeInput label='LSI' a={form.lsi_min} b={form.lsi_max} onA={(v) => setForm((f) => ({ ...f, lsi_min: v }))} onB={(v) => setForm((f) => ({ ...f, lsi_max: v }))} step={0.1} />
        </div>
      ) : (
        <>
          <Field label='pH target' value={`${data.ph_min} – ${data.ph_max}`} />
          <Field label='Free chlorine target' value={`${data.chlorine_min} – ${data.chlorine_max} ppm`} />
          <Field label='LSI target' value={`${data.lsi_min} – ${data.lsi_max}`} />
        </>
      )}
      {error && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</div>}
    </Section>
  )
}

function BrandingTab() {
  const defaults: Branding = { logo_on_pdf: true, show_tech_name: true, show_dosage: true, show_lsi: true, footer_note: '', primary_colour: '#0F172A' }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState<Branding>(defaults)

  useEffect(() => {
    api.get<Branding>('/admin/settings/branding')
      .then((d) => setForm({ ...defaults, ...(d || {}) }))
      .catch((e) => setError(e.message || 'Failed to load report branding'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setError(''); setMsg('')
    try {
      const updated = await api.patch<Branding>('/admin/settings/branding', form)
      setForm({ ...defaults, ...(updated || {}) })
      setMsg('Branding settings saved')
    } catch (e: any) {
      setError(e.message || 'Failed to save branding settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading branding settings…</div>

  return (
    <Section title='Report branding'>
      <div style={{ display: 'grid', gap: 10 }}>
        <Labeled label='Primary colour'><input type='color' value={form.primary_colour} onChange={(e) => setForm((f) => ({ ...f, primary_colour: e.target.value }))} /></Labeled>
        <Check label='Logo on PDF' checked={form.logo_on_pdf} onChange={(v) => setForm((f) => ({ ...f, logo_on_pdf: v }))} />
        <Check label='Show tech name' checked={form.show_tech_name} onChange={(v) => setForm((f) => ({ ...f, show_tech_name: v }))} />
        <Check label='Show dosage' checked={form.show_dosage} onChange={(v) => setForm((f) => ({ ...f, show_dosage: v }))} />
        <Check label='Show LSI' checked={form.show_lsi} onChange={(v) => setForm((f) => ({ ...f, show_lsi: v }))} />
        <Labeled label='Footer note'><input style={inputStyle} value={form.footer_note} onChange={(e) => setForm((f) => ({ ...f, footer_note: e.target.value }))} /></Labeled>
      </div>
      <div style={{ marginTop: 12 }}><button style={primaryBtn} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button></div>
      {error && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</div>}
      {msg && <div style={{ color: '#15803D', fontSize: 12, marginTop: 8 }}>{msg}</div>}
    </Section>
  )
}

function BillingTab() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api.get<BillingStatus>('/admin/billing/status')
      .then(setStatus)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async () => {
    setActionLoading(true)
    try {
      const { url } = await api.post<{ url: string }>('/admin/billing/checkout')
      window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Could not start checkout. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManage = async () => {
    setActionLoading(true)
    try {
      const { url } = await api.post<{ url: string }>('/admin/billing/portal')
      window.open(url, '_blank')
    } catch (e: any) {
      alert(e.message || 'Could not open billing portal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13 }}>Loading billing info…</div>
  if (!status) return <Section title='Billing'><div style={{ fontSize: 13, color: '#6B7280' }}>Billing info unavailable. Please refresh.</div></Section>

  const isTrialing = status.subscription_status === 'trialing'
  const isActive = status.subscription_status === 'active'
  const isPastDue = status.subscription_status === 'past_due'
  const isCancelled = status.subscription_status === 'cancelled'
  const trialExpired = isTrialing && (status.trial_days_remaining ?? 1) <= 0

  return (
    <Section title='Billing'>
      {isTrialing && !trialExpired && <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '3px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>Free trial — {status.trial_days_remaining} {status.trial_days_remaining === 1 ? 'day' : 'days'} remaining</div><div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>After your trial ends, you'll need an active subscription to continue.</div></div>}
      {trialExpired && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '3px solid #EF4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Trial expired</div><div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>Subscribe to restore access.</div></div>}
      {isPastDue && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '3px solid #EF4444', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Payment failed</div><div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>Please update your payment method to avoid interruption.</div></div>}
      {isCancelled && <div style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Subscription cancelled</div><div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Resubscribe to regain access.</div></div>}
      <Field label='Plan' value={status.plan.charAt(0).toUpperCase() + status.plan.slice(1)} />
      <Field label='Status' value={isActive ? 'Active' : isTrialing ? (trialExpired ? 'Trial expired' : 'Free trial') : isPastDue ? 'Past due' : 'Cancelled'} />
      {isTrialing && status.trial_ends_at && <Field label='Trial ends' value={new Date(status.trial_ends_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })} />}
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(isTrialing || isCancelled || trialExpired) && <button onClick={handleUpgrade} disabled={actionLoading} style={primaryBtn}>{actionLoading ? 'Loading…' : 'Upgrade now'}</button>}
        {(isActive || isPastDue) && <button onClick={handleManage} disabled={actionLoading} style={secondaryBtn}>{actionLoading ? 'Loading…' : 'Manage billing'}</button>}
      </div>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9CA3AF', fontWeight: 700, marginBottom: 12 }}>{title}</div>{children}</div>
}

function Field({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}><span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span><span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value}</span></div>
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 12, color: '#374151', fontWeight: 600 }}>{label}{children}</label>
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}><input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>
}

function RangeInput({ label, a, b, onA, onB, step }: { label: string; a: number; b: number; onA: (v: number) => void; onB: (v: number) => void; step: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 13, color: '#374151' }}>{label}</div>
      <input type='number' step={step} value={a} onChange={(e) => onA(Number(e.target.value))} style={inputStyle} />
      <input type='number' step={step} value={b} onChange={(e) => onB(Number(e.target.value))} style={inputStyle} />
    </div>
  )
}

const inputStyle: React.CSSProperties = { fontSize: 13, color: '#111827', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 10px', background: '#F9FAFB', outline: 'none', width: '100%', boxSizing: 'border-box' }
const selectStyle: React.CSSProperties = { ...inputStyle, width: 90 }
const rowBox: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px' }
const xBtn: React.CSSProperties = { border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', width: 28, height: 28, cursor: 'pointer', color: '#6B7280', fontSize: 16, lineHeight: 1 }
const primaryBtn: React.CSSProperties = { background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const secondaryBtn: React.CSSProperties = { background: '#F9FAFB', color: '#111827', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
