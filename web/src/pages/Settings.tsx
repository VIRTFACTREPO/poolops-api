import { useState } from 'react'

type Tab = 'Company' | 'Chemicals' | 'Target ranges' | 'Report branding' | 'Billing'

export default function Settings() {
  const [tab, setTab] = useState<Tab>('Company')

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['Company', 'Chemicals', 'Target ranges', 'Report branding', 'Billing'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#F9FAFB' : '#1E293B',
              color: tab === t ? '#111827' : '#94A3B8',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 14, padding: 14 }}>
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
  return (
    <Section title='Company'>
      <Field label='Company name' value='Pool Pro NZ' />
      <Field label='Support email' value='ops@poolpronz.co.nz' />
      <Field label='Phone' value='+64 9 123 4567' />
    </Section>
  )
}

function ChemicalsTab() {
  return (
    <Section title='Chemicals'>
      <Field label='Default sanitizer' value='Liquid chlorine' />
      <Field label='Acid type' value='Muriatic acid' />
      <Field label='Auto-low-stock threshold' value='20%' />
    </Section>
  )
}

function TargetsTab() {
  return (
    <Section title='Target ranges'>
      <Field label='pH target' value='7.2 – 7.6' />
      <Field label='Free chlorine target' value='1.0 – 3.0 ppm' />
      <Field label='LSI target' value='-0.5 – +0.5' />
    </Section>
  )
}

function BrandingTab() {
  return (
    <Section title='Report branding'>
      <Field label='Primary colour' value='#0F172A' />
      <Field label='Logo on PDF' value='Enabled' />
      <Field label='Footer note' value='Thanks for trusting PoolOps' />
    </Section>
  )
}

function BillingTab() {
  return (
    <Section title='Billing'>
      <Field label='Plan' value='Business' />
      <Field label='Next invoice' value='1 Apr 2026' />
      <Field label='Card' value='Visa •••• 8832' />
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
