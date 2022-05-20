/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SetStateAction } from 'react'
import { useGet, useMutate, GetDataError } from 'restful-react'

export interface TagsResponseDataResource {
  tags?: string
}

export interface TagsResponseData {
  resource?: TagsResponseDataResource
}

export interface TagsResponse {
  data?: TagsResponseData
  loading?: boolean
}

export const folderIdOrBlank = (folderId: string): string => (folderId === 'shared' ? '' : folderId)

export const useGetTags = (accountId: string, folderId: string): TagsResponse => {
  const { data: response, loading: isLoading } = useGet({
    path: `gateway/dashboard/v1/tags`,
    queryParams: {
      accountId: accountId,
      folderId: folderIdOrBlank(folderId)
    }
  })
  return { data: response, loading: isLoading }
}

export interface FolderDetailResponseData {
  resource?: string
}

export interface FolderDetailResponse {
  data?: FolderDetailResponseData
}

export const useGetFolderDetail = (accountId: string, folderId: string): FolderDetailResponse => {
  const { data: folderDetail } = useGet({
    path: 'gateway/dashboard/folderDetail',
    queryParams: { accountId: accountId, folderId: folderIdOrBlank(folderId) }
  })
  return { data: folderDetail }
}

export interface DashboardDetailResponseData {
  title: string
}

export interface DashboardDetailResponse {
  data: DashboardDetailResponseData
}

export const useGetDashboardDetail = (accountId: string, viewId: string): DashboardDetailResponse => {
  const { data: dashboardDetail } = useGet({
    // Inferred from RestfulProvider in index.js
    path: `gateway/dashboard/${viewId}/detail`,
    queryParams: { accountId: accountId }
  })
  return { data: dashboardDetail }
}

export interface CreateSignedUrlResponseResource {
  resource: SetStateAction<string>
}

export interface CreateSignedUrlResponse {
  mutate: (props: any) => Promise<CreateSignedUrlResponseResource>
  loading: boolean
  error?: GetDataError<any> | null
}

export const useMutateCreateSignedUrl = (
  accountId: string,
  viewId: string,
  host: string,
  query: string
): CreateSignedUrlResponse => {
  const { mutate, loading, error } = useMutate({
    verb: 'POST',
    path: 'gateway/dashboard/v1/signedUrl',
    queryParams: {
      accountId: accountId,
      dashboardId: viewId,
      src: `/embed/dashboards-next/${viewId}?embed_domain=${host}&${query}`
    }
  })
  return { mutate, loading, error }
}

export interface DeleteDashboardResponseResource {
  id: string
  folder_id: string
}

export interface DeleteDashboardResponse {
  mutate: (props: { dashboardId: string }) => Promise<DeleteDashboardResponseResource>
  loading: boolean
}

export const useDeleteDashboard = (accountId: string): DeleteDashboardResponse => {
  const { mutate, loading } = useMutate({
    verb: 'DELETE',
    path: 'gateway/dashboard/remove',
    queryParams: {
      accountId: accountId
    }
  })
  return { mutate, loading }
}
