import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import type {IconName} from 'lucide-react/dynamic'
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {searchIconNames} from './icons'
import {LucideGlyph} from './LucideGlyph'

/**
 * How many cells to add per window. Each mounted cell triggers a dynamic import for its glyph,
 * so the whole catalogue is never rendered at once.
 */
const PAGE_SIZE = 120

const SEARCH_DEBOUNCE_MS = 120

interface IconPickerDialogProps {
  id: string
  names: readonly IconName[]
  selected?: string
  onSelect: (name: IconName) => void
  onClose: () => void
}

export function IconPickerDialog({id, names, selected, onSelect, onClose}: IconPickerDialogProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Held in state rather than a ref so the observer effect re-runs once the element exists.
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  const results = useMemo(() => searchIconNames(names, debouncedQuery), [names, debouncedQuery])

  // Show the top of a new result set rather than wherever the previous one was scrolled to.
  useEffect(() => {
    scrollElement?.scrollTo({top: 0})
  }, [results, scrollElement])

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setQuery(event.currentTarget.value),
    [],
  )

  const handleClearQuery = useCallback(() => setQuery(''), [])

  return (
    <Dialog
      id={id}
      header="Select icon"
      onClose={onClose}
      onClickOutside={onClose}
      width={2}
      contentRef={setScrollElement}
    >
      <Stack gap={3} padding={3}>
        <TextInput
          icon={SearchIcon}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onClear={handleClearQuery}
          clearButton={query.length > 0}
          placeholder="Search icons…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search icons"
          autoFocus
        />

        <Text size={1} muted>
          {results.length === names.length
            ? `${names.length.toLocaleString()} icons`
            : `${results.length.toLocaleString()} of ${names.length.toLocaleString()}`}
        </Text>

        {results.length === 0 ? (
          <Box paddingY={5}>
            <Text align="center" size={1} muted>
              No icon matches “{debouncedQuery}”.
            </Text>
          </Box>
        ) : (
          // Keyed by the query so a new search remounts the grid with a fresh window, rather
          // than resetting it from an effect and triggering a second render pass.
          <IconGrid
            key={debouncedQuery}
            results={results}
            scrollElement={scrollElement}
            selected={selected}
            onSelect={onSelect}
          />
        )}
      </Stack>
    </Dialog>
  )
}

interface IconGridProps {
  results: readonly IconName[]
  scrollElement: HTMLDivElement | null
  selected?: string
  onSelect: (name: IconName) => void
}

function IconGrid({results, scrollElement, selected, onSelect}: IconGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Grow the window as the sentinel comes into view, so a glyph is only fetched once the user
  // has actually scrolled far enough to need it.
  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !scrollElement || visibleCount >= results.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, results.length))
        }
      },
      {root: scrollElement, rootMargin: '300px'},
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [results.length, scrollElement, visibleCount])

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
          gap: 2,
        }}
      >
        {results.slice(0, visibleCount).map((name) => (
          <IconCell key={name} name={name} selected={name === selected} onSelect={onSelect} />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden="true" />
    </>
  )
}

interface IconCellProps {
  name: IconName
  selected: boolean
  onSelect: (name: IconName) => void
}

function IconCell({name, selected, onSelect}: IconCellProps) {
  const handleClick = useCallback(() => onSelect(name), [name, onSelect])

  return (
    <Card
      as="button"
      type="button"
      padding={2}
      radius={2}
      tone={selected ? 'primary' : 'inherit'}
      selected={selected}
      onClick={handleClick}
      title={name}
      aria-label={name}
    >
      <Flex align="center" direction="column" gap={2}>
        <LucideGlyph name={name} />
        <Text size={0} muted={!selected} textOverflow="ellipsis" style={{maxWidth: '100%'}}>
          {name}
        </Text>
      </Flex>
    </Card>
  )
}
