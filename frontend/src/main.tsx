import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './index.css'
import App from './App.tsx'

// 暫時使用官方 manifest 進行開發
// TODO: 專案完成後部署自己的 manifest (使用 Cloudflare Tunnel 或類似服務)
const manifestUrl = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
)
