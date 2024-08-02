// app/providers.tsx
'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { VoterProvider } from './context/VoterContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
    <VoterProvider>
      {children}
    </VoterProvider>
  </ChakraProvider>
  )
}