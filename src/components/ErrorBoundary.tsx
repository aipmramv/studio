'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { errorHandler, createErrorContext, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { errorMonitor } from '@/lib/error-monitoring'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Create error context
    const context = createErrorContext(
      undefined, // No request object in client-side
      undefined, // No user object available here
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId
      }
    )

    // Record error for monitoring
    const errorDetails = {
      type: ErrorType.INTERNAL,
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      userMessage: 'An unexpected error occurred in the application',
      severity: ErrorSeverity.HIGH,
      statusCode: 500,
      context,
      originalError: error,
      stack: error.stack,
      retryable: true
    }

    errorMonitor.recordError(errorDetails)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Error Details (Development Mode)
                  </h3>
                  <p className="text-xs text-red-700 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>

              <div className="text-center">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Go to Home Page
                </a>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Error caught by useErrorHandler:', error)

    const context = createErrorContext(
      undefined,
      undefined,
      {
        hookError: true,
        errorInfo,
        timestamp: new Date()
      }
    )

    const errorDetails = {
      type: ErrorType.INTERNAL,
      code: 'REACT_HOOK_ERROR',
      message: error.message,
      userMessage: 'An error occurred while processing your request',
      severity: ErrorSeverity.MEDIUM,
      statusCode: 500,
      context,
      originalError: error,
      stack: error.stack,
      retryable: true
    }

    errorMonitor.recordError(errorDetails)
  }, [])

  return { handleError }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Error fallback components for different scenarios
 */
export const ErrorFallbacks = {
  // Minimal error display
  Minimal: ({ error, retry }: { error?: Error; retry?: () => void }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Something went wrong
          </h3>
          {retry && (
            <div className="mt-2">
              <button
                onClick={retry}
                className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  ),

  // Card-style error display
  Card: ({ error, retry }: { error?: Error; retry?: () => void }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load content</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading this section. Please try again.
        </p>
        {retry && (
          <div className="mt-6">
            <button
              onClick={retry}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  ),

  // Inline error display
  Inline: ({ error, retry }: { error?: Error; retry?: () => void }) => (
    <div className="flex items-center justify-between p-2 bg-red-50 border-l-4 border-red-400">
      <div className="flex items-center">
        <svg className="h-4 w-4 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-red-700">Failed to load</span>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="text-xs text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorBoundary