import { CollectionGrid } from "@/components/collection/CollectionGrid"

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-void">
      <h1 className="px-6 pt-6 font-impact text-2xl uppercase tracking-tight text-text-primary">Collection</h1>
      <CollectionGrid />
    </main>
  )
}
