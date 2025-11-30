import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary component to catch React errors
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // Reload the page to reset state
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600">Bir Hata Oluştu</h1>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">
                <strong>Hata Mesajı:</strong>
              </p>
              <p className="text-red-700 mt-2 font-mono text-sm">
                {this.state.error?.message || 'Bilinmeyen bir hata oluştu'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>💡 Ne Yapmalıyım?</strong>
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc list-inside">
                <li>Girdiğiniz değerleri kontrol edin</li>
                <li>Tüm zorunlu alanların doldurulduğundan emin olun</li>
                <li>Sayısal değerlerin geçerli olduğunu kontrol edin</li>
                <li>Sorun devam ederse, sayfayı yenileyin</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Sayfayı Yenile
              </button>
              <button
                onClick={() => window.location.href = window.location.origin + window.location.pathname}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                🏠 Başa Dön
              </button>
            </div>

            {/* Debug info (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 bg-gray-100 border border-gray-300 rounded-md p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  🔧 Geliştirici Bilgisi
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
