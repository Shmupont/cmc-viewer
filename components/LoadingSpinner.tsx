'use client'

import React from 'react'

export function LoadingSpinner({ size = 24 }: { size?: number }): React.ReactElement {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-border border-t-accent"
      style={{ width: size, height: size }}
    />
  )
}
