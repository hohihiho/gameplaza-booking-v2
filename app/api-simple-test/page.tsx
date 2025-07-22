'use client'

import { useState } from 'react'

export default function SimpleApiTestPage() {
  const [url, setUrl] = useState('/api/devices')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const executeRequest = async () => {
    setLoading(true)
    setResponse('')

    try {
      const parsedHeaders = JSON.parse(headers)
      
      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      }

      if (method !== 'GET' && method !== 'HEAD' && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const contentType = res.headers.get('content-type')
      
      let data
      if (contentType?.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      setResponse(JSON.stringify({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      }, null, 2))
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple API Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Method & URL */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="API URL"
              className="flex-1 px-3 py-2 border rounded"
            />
          </div>

          {/* Headers */}
          <div>
            <label className="block text-sm font-medium mb-1">Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
              rows={4}
            />
          </div>

          {/* Body */}
          {method !== 'GET' && method !== 'HEAD' && (
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body (JSON)"
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                rows={6}
              />
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={executeRequest}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Send Request'}
          </button>

          {/* Response */}
          {response && (
            <div>
              <label className="block text-sm font-medium mb-1">Response</label>
              <pre className="w-full p-4 bg-gray-100 rounded overflow-x-auto text-sm">
                {response}
              </pre>
            </div>
          )}
        </div>

        {/* Quick Examples */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="font-bold mb-4">Quick Examples</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setMethod('GET')
                setUrl('/api/devices')
                setBody('')
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              GET /api/devices - 기기 목록
            </button>
            <button
              onClick={() => {
                setMethod('GET')
                setUrl('/api/time-slots')
                setBody('')
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              GET /api/time-slots - 시간대 목록
            </button>
            <button
              onClick={() => {
                setMethod('POST')
                setUrl('/api/auth/phone')
                setBody('{\n  "phone": "010-1234-5678"\n}')
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              POST /api/auth/phone - 전화번호 인증
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}