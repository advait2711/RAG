import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import StepIndicator from './components/StepIndicator'
import UploadPage from './pages/UploadPage'
import ChunkingPage from './pages/ChunkingPage'
import ChunkViewerPage from './pages/ChunkViewerPage'
import QueryPage from './pages/QueryPage'

const steps = [
  { id: 1, label: 'Upload', path: '/upload' },
  { id: 2, label: 'Chunk', path: '/chunk' },
  { id: 3, label: 'View', path: '/view' },
  { id: 4, label: 'Query', path: '/query' },
]

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [documentInfo, setDocumentInfo] = useState(null)
  const [chunkData, setChunkData] = useState(null)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleUploadComplete = (data) => {
    setSessionId(data.sessionId)
    setDocumentInfo({
      fileName: data.fileName,
      fileSize: data.fileSize,
      textLength: data.textLength,
      textPreview: data.textPreview,
    })
    setChunkData(null)
    setIsEmbedded(false)
    setCurrentStep(2)
  }

  const handleChunkComplete = (data) => {
    setChunkData(data)
    setIsEmbedded(false)
    setCurrentStep(3)
  }

  const handleEmbedComplete = () => {
    setIsEmbedded(true)
    setCurrentStep(4)
  }

  const handleReset = () => {
    setSessionId(null)
    setDocumentInfo(null)
    setChunkData(null)
    setIsEmbedded(false)
    setCurrentStep(1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onReset={handleReset} />
      <StepIndicator steps={steps} currentStep={currentStep} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Routes>
          <Route
            path="/upload"
            element={
              <UploadPage onUploadComplete={handleUploadComplete} />
            }
          />
          <Route
            path="/chunk"
            element={
              sessionId ? (
                <ChunkingPage
                  sessionId={sessionId}
                  documentInfo={documentInfo}
                  onChunkComplete={handleChunkComplete}
                />
              ) : (
                <Navigate to="/upload" replace />
              )
            }
          />
          <Route
            path="/view"
            element={
              chunkData ? (
                <ChunkViewerPage
                  sessionId={sessionId}
                  chunkData={chunkData}
                  onEmbedComplete={handleEmbedComplete}
                  isEmbedded={isEmbedded}
                />
              ) : (
                <Navigate to="/upload" replace />
              )
            }
          />
          <Route
            path="/query"
            element={
              isEmbedded ? (
                <QueryPage sessionId={sessionId} />
              ) : (
                <Navigate to="/upload" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
