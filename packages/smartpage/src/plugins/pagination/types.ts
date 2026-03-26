export interface PaginationOptions {
  pageHeight: number
  pageWidth: string
  pageGap: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  pageGapBackground: string
  enabled: boolean
}

export interface PaginationState {
  pageCount: number
  pageHeight: number
  pageGap: number
  contentHeight: number
  marginTop: number
  marginBottom: number
}
