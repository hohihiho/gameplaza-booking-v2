"use client"
import { Toaster } from 'react-hot-toast'

export default function ToasterHost() {
  return <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
}

