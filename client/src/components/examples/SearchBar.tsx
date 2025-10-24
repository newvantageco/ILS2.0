import { SearchBar } from '../SearchBar'
import { useState } from 'react'

export default function SearchBarExample() {
  const [value, setValue] = useState('')
  
  return (
    <div className="max-w-md">
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="Search orders, patients, or ECPs..."
      />
    </div>
  )
}
