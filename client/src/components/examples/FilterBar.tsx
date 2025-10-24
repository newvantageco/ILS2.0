import { FilterBar } from '../FilterBar'
import { useState } from 'react'

export default function FilterBarExample() {
  const [statusFilter, setStatusFilter] = useState('')
  const [ecpFilter, setEcpFilter] = useState('')

  return (
    <FilterBar
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      ecpFilter={ecpFilter}
      onEcpChange={setEcpFilter}
      onClearFilters={() => {
        setStatusFilter('')
        setEcpFilter('')
      }}
    />
  )
}
