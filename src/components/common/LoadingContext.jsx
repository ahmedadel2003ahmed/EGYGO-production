'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// Create Loading Context
const LoadingContext = createContext({
  isLoading: false,
  setLoading: () => {},
  showLoader: () => {},
  hideLoader: () => {}
})

// Loading Provider Component
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingQueue, setLoadingQueue] = useState(new Set())

  const showLoader = (key = 'default') => {
    setLoadingQueue(prev => new Set([...prev, key]))
  }

  const hideLoader = (key = 'default') => {
    setLoadingQueue(prev => {
      const newQueue = new Set(prev)
      newQueue.delete(key)
      return newQueue
    })
  }

  const setLoading = (loading) => {
    setIsLoading(loading)
  }

  // Update loading state based on queue
  useEffect(() => {
    setIsLoading(loadingQueue.size > 0)
  }, [loadingQueue])

  return (
    <LoadingContext.Provider value={{
      isLoading,
      setLoading,
      showLoader,
      hideLoader
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

// Hook to use loading context
export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Hook for automatic route loading detection
export const useRouteLoading = () => {
  const { showLoader, hideLoader } = useLoading()
  
  useEffect(() => {
    const handleStart = () => showLoader('route')
    const handleComplete = () => hideLoader('route')

    // Listen for route changes
    window.addEventListener('beforeunload', handleStart)
    
    // For Next.js App Router, you might want to use a different approach
    // This is a simplified version - you can enhance it based on your needs
    
    return () => {
      window.removeEventListener('beforeunload', handleStart)
      hideLoader('route')
    }
  }, [showLoader, hideLoader])
}