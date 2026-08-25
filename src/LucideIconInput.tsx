import {AddIcon} from '@sanity/icons/Add'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {SyncIcon} from '@sanity/icons/Sync'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import type {IconName} from 'lucide-react/dynamic.js'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type StringInputProps, set, unset} from 'sanity'

import {IconPickerDialog} from './IconPickerDialog'
import {isIconName, readAllowedIcons, restrictToAllowed} from './icons'
import {LucideGlyph} from './LucideGlyph'

export function LucideIconInput(props: StringInputProps) {
  const {schemaType, value, readOnly, onChange, elementProps} = props

  // Forward the id, ref, focus handlers and aria wiring Sanity supplies, minus the props that
  // only make sense on a text input. Spreading the rest — rather than reading
  // `elementProps.ref` by name — also keeps the React Compiler from flagging a ref read
  // during render.
  //
  // These always land on the button that opens the picker: that button *is* the field as far
  // as the Studio's label and focus tracking are concerned. In particular they must not go on
  // the overflow menu's trigger, because MenuButton assigns that button its own id.
  const {
    value: _value,
    placeholder: _placeholder,
    readOnly: _readOnly,
    autoComplete: _autoComplete,
    onChange: _onChange,
    onPaste: _onPaste,
    ...triggerProps
  } = elementProps

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  // Return focus to the field when the picker closes, however it closed. The Dialog cannot do
  // this itself: choosing an icon swaps the trigger from the "Select icon" button to the
  // selected-icon card, so the element it captured on open no longer exists. Both triggers
  // carry the id Sanity gave the field, so look it up again rather than holding a ref.
  const wasPickerOpen = useRef(false)
  const {id: fieldId} = elementProps

  useEffect(() => {
    if (wasPickerOpen.current && !isPickerOpen) {
      document.getElementById(fieldId)?.focus()
    }

    wasPickerOpen.current = isPickerOpen
  }, [fieldId, isPickerOpen])

  const names = useMemo(
    () => restrictToAllowed(readAllowedIcons(schemaType.options)),
    [schemaType.options],
  )

  const openPicker = useCallback(() => setIsPickerOpen(true), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  const handleSelect = useCallback(
    (name: IconName) => {
      onChange(set(name))
      setIsPickerOpen(false)
    },
    [onChange],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
    setIsPickerOpen(false)
  }, [onChange])

  const picker = isPickerOpen ? (
    <IconPickerDialog
      id={`${elementProps.id}-picker`}
      names={names}
      selected={value}
      onSelect={handleSelect}
      onClose={closePicker}
    />
  ) : null

  if (!value) {
    return (
      <>
        <Button
          {...triggerProps}
          type="button"
          icon={AddIcon}
          text="Select icon"
          mode="ghost"
          disabled={readOnly}
          onClick={openPicker}
        />
        {picker}
      </>
    )
  }

  const known = isIconName(value)

  return (
    <>
      {/* `tone="caution"` flags a value Lucide no longer recognises — a removed brand icon, or
          a name written by an older plugin that mis-derived it from the component name. */}
      <Card border padding={1} radius={2} tone={known ? 'default' : 'caution'}>
        <Flex align="center" gap={1} justify="space-between">
          <Card
            {...triggerProps}
            as="button"
            type="button"
            disabled={readOnly}
            flex={1}
            onClick={openPicker}
            padding={2}
            radius={2}
            title={known ? `Change icon (${value})` : `${value} is not a known Lucide icon`}
            tone="inherit"
          >
            <Flex align="center" gap={3}>
              {known ? (
                <LucideGlyph name={value} />
              ) : (
                <Box style={{width: 24, textAlign: 'center'}}>
                  <Text size={1} muted>
                    ?
                  </Text>
                </Box>
              )}
              <Text size={1} weight="medium">
                {known ? value : `${value} (not found)`}
              </Text>
            </Flex>
          </Card>

          {!readOnly && (
            <MenuButton
              id={`${elementProps.id}-menu`}
              button={
                <Button
                  type="button"
                  icon={EllipsisHorizontalIcon}
                  mode="bleed"
                  padding={2}
                  title="Icon options"
                  aria-label="Icon options"
                />
              }
              menu={
                <Menu>
                  <MenuItem icon={SyncIcon} text="Replace" onClick={openPicker} />
                  <MenuItem icon={TrashIcon} text="Clear" tone="critical" onClick={handleClear} />
                </Menu>
              }
              popover={{portal: true, placement: 'bottom-end'}}
            />
          )}
        </Flex>
      </Card>
      {picker}
    </>
  )
}
