// Minimal wrapper so the portal pages inherit RTL/base CSS from the root layout
// without the app header, middleware guards (matcher excludes /portal), or Toaster.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
