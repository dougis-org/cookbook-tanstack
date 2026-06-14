import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import SingleSelectDropdown from './SingleSelectDropdown'

interface SourcePickerDropdownProps {
  value: string
  selectedName?: string
  onChange: (id: string, name: string) => void
  placeholder?: string
}

export default function SourcePickerDropdown({
  value,
  selectedName = '',
  onChange,
  placeholder = 'Select a source…',
}: SourcePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: allSources = [] } = useQuery({
    ...trpc.sources.list.queryOptions(),
    enabled: isOpen,
  })

  return (
    <SingleSelectDropdown
      options={allSources}
      value={value}
      selectedName={selectedName}
      onChange={onChange}
      placeholder={placeholder}
      emptyMessage="No sources found"
      onOpenChange={setIsOpen}
    />
  )
}
