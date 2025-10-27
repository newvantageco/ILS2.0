import * as React from "react"
import { useNavigate } from "react-router-dom"

type ViewRole = 'owner' | 'ecp' | 'lab-tech' | 'admin'

interface RoleContext {
  baseRole: ViewRole
  currentRole: ViewRole
  switchRole: (role: ViewRole) => void
  resetRole: () => void
}

const RoleContext = React.createContext<RoleContext | undefined>(undefined)

/**
 * Role Provider Component
 * 
 * Manages role-based access and view switching for company owners
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [baseRole] = React.useState<ViewRole>('owner')
  const [currentRole, setCurrentRole] = React.useState<ViewRole>('owner')
  const navigate = useNavigate()

  const switchRole = React.useCallback((role: ViewRole) => {
    setCurrentRole(role)
    
    // Update URL to reflect current view context
    const roleUrls = {
      owner: '/owner/dashboard',
      ecp: '/orders/new',
      'lab-tech': '/production/queue',
      admin: '/admin/dashboard'
    }
    
    navigate(roleUrls[role])
  }, [navigate])

  const resetRole = React.useCallback(() => {
    setCurrentRole(baseRole)
    navigate('/owner/dashboard')
  }, [baseRole, navigate])

  const value = React.useMemo(
    () => ({
      baseRole,
      currentRole,
      switchRole,
      resetRole
    }),
    [baseRole, currentRole, switchRole, resetRole]
  )

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

/**
 * Hook for accessing and managing role state
 * 
 * Provides controlled access to role switching functionality
 */
export function useRole() {
  const context = React.useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

/**
 * Example usage:
 * 
 * function App() {
 *   return (
 *     <RoleProvider>
 *       <OwnerLayout>
 *         <RoutedContent />
 *       </OwnerLayout>
 *     </RoleProvider>
 *   )
 * }
 * 
 * function RoutedContent() {
 *   const { currentRole } = useRole()
 *   
 *   // Render content based on current role view
 *   switch(currentRole) {
 *     case 'ecp':
 *       return <OrderSubmissionForm />
 *     case 'lab-tech':
 *       return <ProductionQueue />
 *     case 'admin':
 *       return <AdminDashboard />
 *     default:
 *       return <OwnerDashboard />
 *   }
 * }
 */