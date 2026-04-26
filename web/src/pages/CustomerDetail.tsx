import { useParams } from 'react-router-dom'

export default function CustomerDetail() {
  const { id } = useParams()
  return <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', letterSpacing: '-0.4px' }}>Customer Detail — {id}</h1>
}
