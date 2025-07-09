import React from 'react'
import { Clock } from 'lucide-react'

export default function CreditManagement() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="flex flex-col items-center gap-4">
        <Clock size={48} className="text-purple-500 animate-pulse" />
        <h1 className="text-3xl font-bold text-gray-800">Credit Management</h1>
        <p className="text-lg text-gray-500">This feature is coming soon!</p>
      </div>
    </div>
  )
}
