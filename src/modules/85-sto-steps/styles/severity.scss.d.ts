/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export type Styles = {
  critical: string
  high: string
  info: string
  low: string
  medium: string
  unassigned: string
}

export type ClassNames = keyof Styles

declare const styles: Styles

export default styles
