import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'
import { colors, radii, spacing, typography } from '../theme/tokens'

type PoolCategory = 'pool' | 'spa'
type PoolEntry = { category: PoolCategory; pool_type: string; volume_litres: string; gate_access: string; warnings: string }

export default function CustomerForm() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [addressLat, setAddressLat] = useState<number | null>(null)
  const [addressLng, setAddressLng] = useState<number | null>(null)
  const [placesReady, setPlacesReady] = useState(false)
  const [placesEnabled, setPlacesEnabled] = useState(false)
  const placesContainerRef = useRef<HTMLDivElement | null>(null)

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'nz' },
      types: ['address'],
    },
    debounce: 250,
    initOnMount: false,
  })
  const [pools, setPools] = useState<PoolEntry[]>([{ category: 'pool', pool_type: 'salt', volume_litres: '', gate_access: '', warnings: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = (import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '').trim()
    if (!key) {
      setPlacesEnabled(false)
      setPlacesReady(false)
      return
    }

    let cancelled = false
    setOptions({ key, libraries: ['places'] })
    importLibrary('places').then(() => {
      if (!cancelled) {
        setPlacesEnabled(true)
        setPlacesReady(true)
      }
    }).catch(() => {
      if (!cancelled) {
        setPlacesEnabled(false)
        setPlacesReady(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setValue(address, false)
  }, [address, setValue])

  useEffect(() => {
    if (!placesEnabled || !placesReady) return
    function onClickOutside(e: MouseEvent) {
      if (placesContainerRef.current && !placesContainerRef.current.contains(e.target as Node)) {
        clearSuggestions()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [placesEnabled, placesReady, clearSuggestions])

  const formatVolume = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString() : ''
  }

  const updatePool = (i: number, field: keyof PoolEntry, value: string) =>
    setPools(prev => prev.map((p, idx) => {
      if (idx !== i) return p
      if (field === 'category') {
        return { ...p, category: value as PoolCategory, pool_type: value === 'spa' ? 'spa-salt' : 'salt' }
      }
      if (field === 'volume_litres') {
        return { ...p, volume_litres: formatVolume(value) }
      }
      return { ...p, [field]: value }
    }))

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !address.trim() || pools.some(p => !p.volume_litres.replace(/,/g, ''))) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const companyId = getUser()?.companyId
      if (!companyId) throw new Error('No company found — please log in as a company admin')
      const company = { id: companyId }

      // Find-or-create: if a previous save partially failed, reuse the existing customer row
      let customerId: string
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.trim())
        .eq('company_id', company.id)
        .maybeSingle()

      if (existing) {
        customerId = existing.id
      } else {
        const customerPayload: Record<string, unknown> = {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          address,
          address_lat: addressLat,
          address_lng: addressLng,
          company_id: company.id,
        }

        let createResult = await supabase
          .from('customers')
          .insert(customerPayload)
          .select('id')
          .single()

        if (createResult.error?.message?.toLowerCase().includes('address_lat') || createResult.error?.message?.toLowerCase().includes('address_lng')) {
          const fallbackPayload = {
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || null,
            address,
            company_id: company.id,
          }
          createResult = await supabase
            .from('customers')
            .insert(fallbackPayload)
            .select('id')
            .single()
        }

        if (createResult.error) throw createResult.error
        customerId = createResult.data.id
      }

      for (const pool of pools) {
        const { error: poolErr } = await supabase.from('pools').insert({
          customer_id: customerId,
          company_id: company.id,
          volume_litres: Number(pool.volume_litres.replace(/,/g, '')),
          pool_type: pool.pool_type,
          gate_access: pool.gate_access || null,
          warnings: pool.warnings || null,
        })
        if (poolErr) throw poolErr
      }

      navigate('/customers')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 0, maxWidth: 560 }}>
      <h1 style={{ fontSize: typography.sizes.h2, fontWeight: typography.weights.bold, color: colors.textHeading, letterSpacing: -0.3, margin: 0, marginBottom: spacing.lg }}>
        New Customer
      </h1>

      <div style={{ background: colors.white, border: `1px solid ${colors.border}`, borderRadius: radii.standard, overflow: 'hidden' }}>
        <Section title='Contact' first>
          <Fields>
            <Row>
              <input style={field} placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input style={field} placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Row>
            <input style={field} placeholder='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={field} placeholder='Phone (optional)' value={phone} onChange={(e) => setPhone(e.target.value)} />
            {placesEnabled && placesReady ? (
              <div ref={placesContainerRef} style={{ position: 'relative' }}>
                <input
                  style={field}
                  placeholder='Address'
                  value={value}
                  onChange={(e) => {
                    const next = e.target.value
                    setValue(next)
                    setAddress(next)
                    setAddressLat(null)
                    setAddressLng(null)
                  }}
                  disabled={!ready}
                />
                {status === 'OK' && data.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0, background: '#111827', borderRadius: radii.md, border: '1px solid #374151', overflow: 'hidden' }}>
                    {data.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type='button'
                        onClick={async () => {
                          const selectedAddress = suggestion.description
                          setValue(selectedAddress, false)
                          setAddress(selectedAddress)
                          clearSuggestions()
                          try {
                            const geocode = await getGeocode({ placeId: suggestion.place_id })
                            const formatted = geocode[0]?.formatted_address || selectedAddress
                            const { lat, lng } = getLatLng(geocode[0])
                            setAddress(formatted)
                            setValue(formatted, false)
                            setAddressLat(lat)
                            setAddressLng(lng)
                          } catch {
                            setAddressLat(null)
                            setAddressLng(null)
                          }
                        }}
                        style={{ width: '100%', textAlign: 'left', background: '#111827', color: '#FFFFFF', border: 'none', borderBottom: '1px solid #374151', padding: `${spacing.sm}px ${spacing.md}px`, cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#374151' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#111827' }}
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                style={field}
                placeholder='Address'
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setAddressLat(null)
                  setAddressLng(null)
                }}
              />
            )}
          </Fields>
        </Section>

        <Section title='Pool / Spa'>
          <Fields>
            {pools.map((pool, i) => {
              const isSpa = pool.category === 'spa'
              const pillBg = isSpa ? '#F5F3FF' : '#EFF6FF'
              const pillBorder = isSpa ? '#DDD6FE' : '#BFDBFE'
              const pillColor = isSpa ? '#6D28D9' : '#1D4ED8'
              return (
                <div key={i} style={{ position: 'relative', background: colors.surface, border: `1px solid ${isSpa ? '#DDD6FE' : colors.border}`, borderRadius: radii.md, padding: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}>
                      {isSpa ? 'Spa Pool' : 'Pool'}
                    </span>
                    {pools.length > 1 && (
                      <button
                        onClick={() => setPools(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                      >×</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: spacing.sm }}>
                    <Row>
                      <input style={field} placeholder='Volume (litres)' value={pool.volume_litres} onChange={(e) => updatePool(i, 'volume_litres', e.target.value)} type='text' inputMode='numeric' />
                      <select style={field as React.CSSProperties} value={pool.pool_type} onChange={(e) => updatePool(i, 'pool_type', e.target.value)}>
                        {isSpa ? (
                          <>
                            <option value='spa-salt'>Salt</option>
                            <option value='spa-chlorine'>Chlorine</option>
                            <option value='spa-mineral'>Mineral</option>
                            <option value='spa-freshwater'>Freshwater</option>
                          </>
                        ) : (
                          <>
                            <option value='salt'>Salt</option>
                            <option value='chlorine'>Chlorine</option>
                            <option value='mineral'>Mineral</option>
                            <option value='freshwater'>Freshwater</option>
                          </>
                        )}
                      </select>
                    </Row>
                    <input style={field} placeholder='Gate code / lockbox' value={pool.gate_access} onChange={(e) => updatePool(i, 'gate_access', e.target.value)} />
                    <input style={field} placeholder='Site notes (pets, alarms, etc.)' value={pool.warnings} onChange={(e) => updatePool(i, 'warnings', e.target.value)} />
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
              <button
                type='button'
                onClick={() => setPools(prev => [...prev, { category: 'pool', pool_type: 'salt', volume_litres: '', gate_access: '', warnings: '' }])}
                style={{ background: 'transparent', border: `1px dashed #BFDBFE`, borderRadius: radii.md, color: '#1D4ED8', padding: `${spacing.sm}px ${spacing.md}px`, fontSize: typography.sizes.small, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const }}
              >
                + Add pool
              </button>
              <button
                type='button'
                onClick={() => setPools(prev => [...prev, { category: 'spa', pool_type: 'spa-salt', volume_litres: '', gate_access: '', warnings: '' }])}
                style={{ background: 'transparent', border: `1px dashed #DDD6FE`, borderRadius: radii.md, color: '#6D28D9', padding: `${spacing.sm}px ${spacing.md}px`, fontSize: typography.sizes.small, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const }}
              >
                + Add spa pool
              </button>
            </div>
          </Fields>
        </Section>

        <Section title='Service plan'>
          <Fields>
            <Row>
              <select style={field as React.CSSProperties} defaultValue='fortnightly'>
                <option value='weekly'>Weekly</option>
                <option value='fortnightly'>Fortnightly</option>
                <option value='monthly'>Monthly</option>
              </select>
              <select style={field as React.CSSProperties} defaultValue='Monday'>
                <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
              </select>
            </Row>
          </Fields>
        </Section>
      </div>

      <div style={{
        marginTop: spacing.md,
        background: colors.amberBg,
        border: `1px solid ${colors.amberBorder}`,
        borderLeft: `3px solid ${colors.amber}`,
        color: colors.amberText,
        borderRadius: radii.lg,
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontSize: typography.sizes.small,
        lineHeight: 1.5,
      }}>
        ⚠ Owner invite will be sent once saved. Please verify contact details and service frequency.
      </div>

      {error && (
        <div style={{ marginTop: spacing.sm, fontSize: typography.sizes.small, color: colors.red, background: colors.redBg, border: `1px solid ${colors.redBorder}`, borderRadius: radii.md, padding: `${spacing.sm}px ${spacing.md}px` }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: spacing.md,
          background: loading ? colors.textMuted : colors.ink,
          color: colors.white,
          border: 'none',
          borderRadius: radii.pill,
          padding: `${spacing.md}px`,
          fontSize: typography.sizes.body,
          fontWeight: typography.weights.bold,
          cursor: loading ? 'not-allowed' : 'pointer',
          minHeight: 52,
          letterSpacing: -0.2,
        }}
      >
        {loading ? 'Saving…' : 'Save & invite owner'}
      </button>
    </div>
  )
}

function Section({ title, children, first = false }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{
      padding: spacing.md,
      borderTop: first ? 'none' : `1px solid ${colors.border}`,
    }}>
      <div style={{
        fontSize: typography.sizes.label,
        fontWeight: typography.weights.bold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Fields({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gap: spacing.sm }}>{children}</div>
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>{children}</div>
}

const field: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  padding: `10px ${spacing.md}px`,
  color: colors.ink,
  fontSize: typography.sizes.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
