/**
 * Advanced Search Utilities
 * Provides full-text search and filtering capabilities
 */

import { Prisma } from '@prisma/client'

export interface SearchOptions {
  query: string
  fields: string[]
  caseSensitive?: boolean
}

/**
 * Create Prisma where clause for full-text search
 */
export function createSearchWhere(
  searchQuery: string,
  searchableFields: string[]
): Prisma.Enumerable<Prisma.StringFilter> | undefined {
  if (!searchQuery || !searchableFields.length) {
    return undefined
  }

  const searchTerms = searchQuery
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)

  if (searchTerms.length === 0) {
    return undefined
  }

  // For SQLite, we use contains (case-insensitive search not directly supported)
  // For PostgreSQL, we could use full-text search
  return {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: searchQuery,
      },
    })),
  } as any
}

/**
 * Create advanced filter where clause
 */
export function createAdvancedFilter(filters: Record<string, any>): any {
  const where: any = {}

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    // Handle date ranges
    if (key.endsWith('From') || key.endsWith('To')) {
      const baseKey = key.replace(/From|To$/, '')
      if (!where[baseKey]) {
        where[baseKey] = {}
      }
      if (key.endsWith('From')) {
        where[baseKey].gte = new Date(value)
      } else {
        where[baseKey].lte = new Date(value)
      }
      continue
    }

    // Handle arrays (IN clause)
    if (Array.isArray(value) && value.length > 0) {
      where[key] = { in: value }
      continue
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      where[key] = value
      continue
    }

    // Handle string contains
    if (typeof value === 'string') {
      where[key] = { contains: value }
      continue
    }

    // Default: exact match
    where[key] = value
  }

  return where
}

/**
 * Combine search and filter where clauses
 */
export function combineWhereClauses(
  searchWhere: any,
  filterWhere: any
): any {
  if (!searchWhere && !filterWhere) {
    return {}
  }

  if (!searchWhere) {
    return filterWhere
  }

  if (!filterWhere) {
    return searchWhere
  }

  return {
    AND: [searchWhere, filterWhere],
  }
}

