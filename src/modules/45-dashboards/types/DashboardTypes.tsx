/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export interface IDashboard {
  id: string
  type: string
  description: string
  title: string
  view_count: number
  favorite_count: number
  created_at: string
  data_source: DashboardTag[] | string[]
  last_accessed_at: string
  resourceIdentifier: string
}

export enum DashboardTag {
  CD = 'CD',
  CE = 'CE',
  CF = 'CF',
  CG_CD = 'CG_CD',
  CI = 'CI'
}

export enum DashboardType {
  SHARED = 'SHARED',
  ACCOUNT = 'ACCOUNT'
}

export enum DashboardLayoutViews {
  LIST,
  GRID
}

export interface IDashboardFormData {
  id: string
  resourceIdentifier: string
  title: string
  description: string
}
