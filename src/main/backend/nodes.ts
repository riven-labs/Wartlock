export type PublicNode = {
  label: string
  url: string
}

export const PUBLIC_NODES: PublicNode[] = [
  { label: 'Polaire Warthog Node', url: 'http://217.182.64.43:3001/' },
]

export const LOCAL_NODE_DEFAULT: PublicNode = {
  label: 'Local node',
  url: 'http://localhost:3000',
}
