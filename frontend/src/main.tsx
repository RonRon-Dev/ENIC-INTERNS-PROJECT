import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App"
import { Toaster } from "./components/ui/sonner"
import { ThemeProvider } from "next-themes"

createRoot(document.getElementById("root")!).render(

  <StrictMode>
    <Toaster duration={5000} position="top-right" />
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
