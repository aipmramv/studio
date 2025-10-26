'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, Loader2 } from 'lucide-react'
import { AssetData } from '@/types/asset'
import { debounce } from 'lodash'

interface AssetSearchProps {
  onAssetSelect: (asset: AssetData) => void
  placeholder?: string
  className?: string
}

interface SearchResult {
  asset: AssetData
  score: number
  matchedFields: string[]
}

export function AssetSearch({ onAssetSelect, placeholder = "Search assets...", className }: AssetSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setShowResults(false)
        return
      }

      try {
        setIsSearching(true)
        setError(null)

        const response = await fetch(`/api/assets/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
        
        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        
        if (data.success) {
          setResults(data.data.results || [])
          setShowResults(true)
        } else {
          throw new Error(data.message || 'Search failed')
        }
      } catch (error) {
        console.error('Search error:', error)
        setError(error instanceof Error ? error.message : 'Search failed')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query)
    
    // Cleanup function to cancel debounced calls
    return () => {
      debouncedSearch.cancel()
    }
  }, [query, debouncedSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleAssetSelect = (asset: AssetData) => {
    onAssetSelect(asset)
    setQuery('')
    setShowResults(false)
    setResults([])
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setError(null)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10"
          onFocus={() => query && setShowResults(true)}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => setShowResults(false), 200)
          }}
        />
        {(query || isSearching) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (query || error) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {error ? (
              <div className="p-4 text-center text-red-600">
                <p>{error}</p>
              </div>
            ) : results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No assets found matching "{query}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result) => (
                  <div
                    key={result.asset.id}
                    className="p-4 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleAssetSelect(result.asset)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {highlightMatch(result.asset.assetNumber, query)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {highlightMatch(result.asset.assetDescription, query)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {result.asset.department}
                        </Badge>
                        <Badge 
                          variant={result.asset.currentStatus === 'Active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {result.asset.currentStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>{result.asset.location}</span>
                        {result.asset.brandName && result.asset.modelNo && (
                          <span>
                            {highlightMatch(`${result.asset.brandName} ${result.asset.modelNo}`, query)}
                          </span>
                        )}
                      </div>
                      
                      {/* Show matched fields */}
                      {result.matchedFields.length > 0 && (
                        <div className="flex space-x-1">
                          {result.matchedFields.slice(0, 3).map((field) => (
                            <Badge key={field} variant="outline" className="text-xs px-1 py-0">
                              {field}
                            </Badge>
                          ))}
                          {result.matchedFields.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{result.matchedFields.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Quick search component for global use
export function QuickAssetSearch({ onAssetSelect, className }: AssetSearchProps) {
  return (
    <AssetSearch
      onAssetSelect={onAssetSelect}
      placeholder="Quick search assets..."
      className={className}
    />
  )
}

// Advanced search with filters
interface AdvancedAssetSearchProps extends AssetSearchProps {
  filters?: {
    departments?: string[]
    statuses?: string[]
    classifications?: string[]
    locations?: string[]
  }
  onFiltersChange?: (filters: any) => void
}

export function AdvancedAssetSearch({ 
  onAssetSelect, 
  filters, 
  onFiltersChange,
  className 
}: AdvancedAssetSearchProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className={className}>
      <div className="flex space-x-2">
        <div className="flex-1">
          <AssetSearch onAssetSelect={onAssetSelect} />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          Filters
        </Button>
      </div>
      
      {showFilters && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Filter controls would go here */}
              <p className="text-sm text-muted-foreground col-span-full">
                Advanced filters will be implemented in the next iteration
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}