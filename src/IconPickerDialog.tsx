// oxlint-disable jsx-a11y/prefer-tag-over-role -- the rule suggests <select>/<option>, which
// cannot contain an SVG glyph and a styled label, and cannot lay out as a 2D grid. Listbox
// semantics with a roving tabindex are the correct pattern for a picker of this shape.
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import type {IconName} from 'lucide-react/dynamic.js'
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

  // Arrow-down out of the search field moves into the grid, so the whole picker is reachable
  // without ever touching the mouse.
  const handleSearchKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown') {
      return
    }

    const firstOption = event.currentTarget
      .closest('[role="dialog"]')
      ?.querySelector<HTMLElement>('[role="option"]')

    if (firstOption) {
      event.preventDefault()
      firstOption.focus()
    }
  }, [])

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
          onKeyDown={handleSearchKeyDown}
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
          // Keyed by the query so a new search remounts the grid with a fresh window and a
          // reset cursor, rather than resetting them from an effect and triggering a second
          // render pass.
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

  // Roving tabindex: exactly one cell is tabbable, and the arrow keys move the cursor. Without
  // this every icon is its own tab stop, which strands keyboard users hundreds of presses from
  // anything further down the catalogue.
  const [activeIndex, setActiveIndex] = useState(0)

  const gridRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Only pull focus when the user drove the move with the keyboard — never on mount, where it
  // would steal focus from the search field.
  const shouldFocusActive = useRef(false)

  useEffect(() => {
    if (!shouldFocusActive.current) {
      return
    }

    shouldFocusActive.current = false
    gridRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex]?.focus()
  }, [activeIndex, visibleCount])

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

  const moveTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), results.length - 1)

      // Arrowing past the rendered window pulls the next page in rather than dead-ending.
      if (next >= visibleCount) {
        setVisibleCount(Math.min(next + PAGE_SIZE, results.length))
      }

      shouldFocusActive.current = true
      setActiveIndex(next)
    },
    [results.length, visibleCount],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // `auto-fill` decides the column count, so read it back rather than assuming.
      const tracks = gridRef.current
        ? getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').filter(Boolean).length
        : 1
      const columns = Math.max(1, tracks)

      switch (event.key) {
        case 'ArrowRight':
          moveTo(activeIndex + 1)
          break
        case 'ArrowLeft':
          moveTo(activeIndex - 1)
          break
        case 'ArrowDown':
          moveTo(activeIndex + columns)
          break
        case 'ArrowUp':
          moveTo(activeIndex - columns)
          break
        case 'Home':
          moveTo(0)
          break
        case 'End':
          moveTo(results.length - 1)
          break
        default:
          return
      }

      event.preventDefault()
    },
    [activeIndex, moveTo, results.length],
  )

  // Keep the cursor on whatever actually holds focus, so clicking or tabbing into a cell and
  // then arrowing continues from there.
  const handleFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const options = gridRef.current?.querySelectorAll<HTMLElement>('[role="option"]')

    if (!options) {
      return
    }

    const index = [...options].indexOf(event.target)

    if (index !== -1) {
      setActiveIndex(index)
    }
  }, [])

  return (
    <>
      <div
        ref={gridRef}
        role="listbox"
        aria-label="Icons"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
          gap: 2,
        }}
      >
        {results.slice(0, visibleCount).map((name, index) => (
          <IconCell
            key={name}
            name={name}
            selected={name === selected}
            tabbable={index === activeIndex}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden="true" />
    </>
  )
}

interface IconCellProps {
  name: IconName
  selected: boolean
  tabbable: boolean
  onSelect: (name: IconName) => void
}

function IconCell({name, selected, tabbable, onSelect}: IconCellProps) {
  const handleClick = useCallback(() => onSelect(name), [name, onSelect])

  return (
    <Card
      as="button"
      type="button"
      role="option"
      aria-selected={selected}
      tabIndex={tabbable ? 0 : -1}
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
