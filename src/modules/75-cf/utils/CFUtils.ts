/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useCallback, useMemo, useState } from 'react'
import { Intent, IToaster, IToasterProps, Position, Toaster } from '@blueprintjs/core'
import { get } from 'lodash-es'
import { Utils } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { Feature, Variation } from 'services/cf'
import type { EnvironmentResponseDTO } from 'services/cd-ng'

const LOCALE = 'en'

/**
 * Format a timestamp to short format time (i.e: 7:41 AM)
 * @param timestamp Timestamp
 * @param timeStyle Optional DateTimeFormat's `timeStyle` option.
 */
export function formatTime(timestamp: number, timeStyle = 'short'): string {
  return new Intl.DateTimeFormat(LOCALE, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS built-in type for DateTimeFormat is not correct
    timeStyle
  }).format(new Date(timestamp))
}

/**
 * Format a timestamp to medium format date (i.e: Jan 1, 2021)
 * @param timestamp Timestamp
 * @param dateStyle Optional DateTimeFormat's `dateStyle` option.
 */
export function formatDate(timestamp: number, dateStyle = 'medium'): string {
  return new Intl.DateTimeFormat(LOCALE, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS built-in type for DateTimeFormat is not correct
    dateStyle
  }).format(new Date(timestamp))
}

export const formatToCompactNumber = (longNumber: number): string => {
  if (longNumber > 999 && longNumber < 1000000) {
    return (longNumber / 1000).toFixed(0) + 'K'
  } else if (longNumber >= 1000000) {
    return (longNumber / 1000000).toFixed(0) + 'M'
  } else {
    return longNumber.toString()
  }
}

export enum FFDetailPageTab {
  TARGETING = 'targeting',
  METRICS = 'metrics',
  ACTIVITY = 'activity',
  FLAG_PIPELINE = 'flag_pipeline'
}

export enum FeatureFlagMutivariateKind {
  json = 'json',
  string = 'string',
  number = 'int'
}

export const CF_LOCAL_STORAGE_ENV_KEY = 'cf_selected_env'
export const DEFAULT_ENV = { label: '', value: '' }
export const CF_DEFAULT_PAGE_SIZE = 15
export const ADIT_LOG_EMPTY_ENTRY_ID = '00000000-0000-0000-0000-000000000000'

export const FeatureFlagActivationStatus = {
  ON: 'on',
  OFF: 'off'
}

export const AuditLogObjectType = {
  FeatureActivation: 'FeatureActivation' as const,
  Segment: 'Segment' as const
}

export const AuditLogAction = {
  FeatureActivationCreated: 'FeatureActivationCreated',
  SegmentCreated: 'SegmentCreated',
  FeatureActivationPatched: 'FeatureActivationPatched',
  SegmentPatched: 'SegmentPatched'
}

export const isFeatureFlagOn = (featureFlag: Feature): boolean => {
  return featureFlag.envProperties?.state?.toLocaleLowerCase() === FeatureFlagActivationStatus.ON
}

export const featureFlagHasCustomRules = (featureFlag: Feature) => {
  return !!(featureFlag.envProperties?.rules?.length || featureFlag.envProperties?.variationMap?.length)
}

export enum FeatureFlagBucketBy {
  IDENTIFIER = 'identifier',
  NAME = 'name'
}

export const useBucketByItems = () => {
  const { getString } = useStrings()
  const [additions, setAdditions] = useState<string[]>([])
  const addBucketByItem = useCallback(
    (item: string) => {
      const _item = (item || '').trim()

      if (
        _item &&
        _item !== FeatureFlagBucketBy.NAME &&
        _item !== FeatureFlagBucketBy.IDENTIFIER &&
        !additions.includes(_item)
      ) {
        setAdditions([...additions, _item])
      }
    },
    [additions, setAdditions]
  )
  const bucketByItems = useMemo(() => {
    const _items = [
      {
        label: getString('identifier'),
        value: FeatureFlagBucketBy.IDENTIFIER as string
      },
      {
        label: getString('name'),
        value: FeatureFlagBucketBy.NAME as string
      }
    ]

    if (additions.length) {
      additions.forEach(addition => _items.push({ label: addition, value: addition }))
    }

    return _items
  }, [getString, additions])

  return { bucketByItems, addBucketByItem }
}

// This util unescape <strong/> sequences in i18n output to support bold text
// Note: To avoid XSS vulnerability, call replace() with full
// escaped sequences and not single character like `<', '>', etc...
export const unescapeI18nSupportedTags = (str: string) =>
  str.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;&#x2F;strong&gt;/g, '</strong>')

// FF Environment SDK Type
export enum EnvironmentSDKKeyType {
  SERVER = 'server',
  CLIENT = 'client'
}

export const DISABLE_AVATAR_PROPS = {
  onMouseEnter: Utils.stopEvent,
  onClick: Utils.stopEvent,
  onMouseDown: Utils.stopEvent,
  style: { cursor: 'default' }
}

export enum SortOrder {
  ASCENDING = 'ASCENDING',
  DESCENDING = 'DESCENDING'
}

export enum SegmentsSortByField {
  NAME = 'name'
}

export enum FlagsSortByField {
  NAME = 'name',
  IDENTIFIER = 'identifier',
  ARCHIVED = 'archived',
  KIND = 'kind',
  MODIFIED_AT = 'modifiedAt'
  // TODO: backend needs to support Last Evaluated & Variation, etc..
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorMessage = (error: any): string =>
  get(error, 'data.error', get(error, 'data.message', error?.message))

export const TARGET_PRIMARY_COLOR = '#47D5DF'
export const SEGMENT_PRIMARY_COLOR = '#BDA5F2'

const ABBREV = 'KMB'

function round(n: number, precision: number): number {
  const prec = Math.pow(10, precision)
  return Math.round(n * prec) / prec
}

export function formatNumber(n: number, useIntl?: boolean): string {
  if (useIntl) {
    return new Intl.NumberFormat().format(n)
  }

  let base = Math.floor(Math.log(Math.abs(n)) / Math.log(1000))
  const suffix = ABBREV[Math.min(2, base - 1)]
  base = ABBREV.indexOf(suffix) + 1
  return suffix ? round(n / Math.pow(1000, base), 2) + suffix : '' + n
}

export enum EntityAddingMode {
  DIRECT = 'DIRECT',
  CONDITION = 'CONDITION'
}

export const useFeatureFlagTypeToStringMapping = (): { string: string; boolean: string; int: string; json: string } => {
  const { getString } = useStrings()
  const typeMapping = useMemo(
    () => ({
      string: getString('string'),
      boolean: getString('cf.boolean'),
      int: getString('number'),
      json: getString('cf.creationModal.jsonType')
    }),
    [getString]
  )

  return typeMapping
}

/** This utility shows a toaster without being bound to any component.
 * It's useful to show cross-page/component messages */
export function showToaster(message: string, props?: IToasterProps): IToaster {
  const toaster = Toaster.create({ position: Position.TOP })
  toaster.show({ message, intent: Intent.SUCCESS, ...props })
  return toaster
}

export const isNumeric = (input: string): boolean => /^-{0,1}\d*\.{0,1}\d+$/.test(input)

export type UseValidateVariationValuesResult = (
  variations: Variation[],
  featureFlagKind: string
) => { variations?: Array<{ value?: string }> }

export function useValidateVariationValues(): UseValidateVariationValuesResult {
  const { getString } = useStrings()
  const validateVariationValues = useCallback<UseValidateVariationValuesResult>(
    (variations, featureFlagKind) => {
      const isTypeNumber = featureFlagKind === FeatureFlagMutivariateKind.number
      let variationErrors: Array<{ value?: string }> | undefined = undefined

      // Values must be number when type is number and valid JSON when type is JSON
      if (isTypeNumber || featureFlagKind === FeatureFlagMutivariateKind.json) {
        variationErrors = variations.map((variation: Variation) => {
          if (isTypeNumber) {
            return isNumeric(variation.value) ? {} : { value: getString('cf.creationModal.mustBeNumber') }
          } else {
            try {
              JSON.parse(variation.value)
            } catch (_e) {
              return { value: getString('cf.creationModal.mustBeValidJSON') }
            }
            return {}
          }
        })
        variationErrors = variationErrors.find((error: { value?: string }) => error.value) ? variationErrors : undefined
      }

      const result = {
        ...(variationErrors ? { variations: variationErrors } : undefined)
      }

      return result
    },
    [getString]
  )

  return validateVariationValues
}

// Colors used for CF banners
export const ColorPickerColors = [
  '#e63535',
  '#ff3b3b',
  '#ff5c5c',
  '#ff8080',
  '#ffe6e6', // red
  '#05a660',
  '#06c270',
  '#39d98a',
  '#57eba1',
  '#e3fff1', // green
  '#004fc4',
  '#0063f7',
  '#5b8def',
  '#9dbff9',
  '#e5f0ff', // blue
  '#e6b800',
  '#ffcc00',
  '#fddd48',
  '#fded72',
  '#fffee6', // yellow
  '#e67a00',
  '#ff8800',
  '#fdac42',
  '#fccc75',
  '#fff8e6', // orange
  '#00b7c4',
  '#00cfde',
  '#73dfe7',
  '#a9eff2',
  '#e6ffff', // teal
  '#4d0099',
  '#6600cc',
  '#ac5dd9',
  '#dda5e9',
  '#ffe6ff', // purple
  '#e4e4eb',
  '#ebebf0',
  '#f2f2f5',
  '#fafafc',
  '#ffffff', // grey
  '#1c1c28',
  '#28293d',
  '#555770',
  '#8f90a6',
  '#c7c9d9' // black
]

export const rewriteCurrentLocationWithActiveEnvironment = (activeEnvironment: EnvironmentResponseDTO): void => {
  if (!activeEnvironment) {
    return
  }

  const hrefParts = location.href.split('?')
  const activeQueryParams: Record<string, string> = (hrefParts[1] || '')
    .split('&')
    .filter(entry => !!entry?.length)
    .map(item => item.split('='))
    .reduce((params, item) => {
      params[item[0]] = item[1]
      return params
    }, {} as Record<string, string>)

  activeQueryParams.activeEnvironment = activeEnvironment.identifier || ''
  location.replace(
    hrefParts[0] +
      '?' +
      Object.entries(activeQueryParams)
        .map(pair => pair.join('='))
        .join('&')
  )
}

export const getDefaultVariation = (flag: Feature): Variation => {
  if (!isFeatureFlagOn(flag)) {
    return flag.variations.find(({ identifier }) => identifier === flag.defaultOffVariation) as Variation
  }

  if (flag.envProperties?.defaultServe?.variation) {
    const variation = flag.variations.find(
      ({ identifier }) => identifier === flag.envProperties?.defaultServe?.variation
    )

    if (variation) {
      return variation
    }
  }

  return flag.variations.find(({ identifier }) => identifier === flag.defaultOnVariation) as Variation
}
