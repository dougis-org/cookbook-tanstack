import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import SingleSelectDropdown from './SingleSelectDropdown'

interface CategoryPickerDropdownProps {
  id?: string
  value: string
  selectedName?: string
  onChange: (id: string, name: string) => void
  placeholder?: string
}

export default function CategoryPickerDropdown({
  id,
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select a category…',
}: CategoryPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: classifications = [] } = useQuery({
    ...trpc.classifications.list.queryOptions(),
    enabled: isOpen,
  })

  return (
    <SingleSelectDropdown
      id={id}
      options={classifications}
      value={value}
      selectedName={selectedName}
      onChange={onChange}
      placeholder={placeholder}
      emptyMessage="No categories found"
      onOpenChange={setIsOpen}
    />
  )
}
