import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/students':                  { target: 'http://localhost:8091', changeOrigin: true },
      '/api/guardians':                 { target: 'http://localhost:8091', changeOrigin: true },
      '/api/addresses':                 { target: 'http://localhost:8091', changeOrigin: true },
      '/api/contact-info':              { target: 'http://localhost:8091', changeOrigin: true },
      '/api/enrollments':               { target: 'http://localhost:8091', changeOrigin: true },
      '/api/user-accounts':             { target: 'http://localhost:8091', changeOrigin: true },
      '/api/student-profile-snapshots': { target: 'http://localhost:8091', changeOrigin: true },
      '/api/fee-structures':            { target: 'http://localhost:8092', changeOrigin: true },
      '/api/fee-invoices':              { target: 'http://localhost:8092', changeOrigin: true },
      '/api/payment-transactions':      { target: 'http://localhost:8092', changeOrigin: true },
      '/api/discount-policies':         { target: 'http://localhost:8092', changeOrigin: true },
      '/api/vehicles':                  { target: 'http://localhost:8093', changeOrigin: true },
      '/api/drivers':                   { target: 'http://localhost:8093', changeOrigin: true },
      '/api/transport-routes':          { target: 'http://localhost:8093', changeOrigin: true },
      '/api/route-stops':               { target: 'http://localhost:8093', changeOrigin: true },
      '/api/transport-assignments':     { target: 'http://localhost:8093', changeOrigin: true },
      '/api/trip-sessions':             { target: 'http://localhost:8093', changeOrigin: true },
      '/api/vehicle-tracking':          { target: 'http://localhost:8093', changeOrigin: true },
      '/api/student-trip-status':       { target: 'http://localhost:8093', changeOrigin: true },
      '/api/notifications':             { target: 'http://localhost:8094', changeOrigin: true },
      '/api/chat':                      { target: 'http://localhost:8094', changeOrigin: true },
      '/api/tickets':                   { target: 'http://localhost:8094', changeOrigin: true },
    },
  },
})
