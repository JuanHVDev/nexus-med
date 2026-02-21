import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[160px] gap-4">
        <div className="md:col-span-2 md:row-span-2">
          <Card className="h-full border-none bg-muted/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-muted-foreground/20 rounded mb-4" />
              <div className="h-24 w-24 bg-muted-foreground/20 rounded" />
            </CardContent>
          </Card>
        </div>
        
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="h-full border-none bg-muted/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted-foreground/20 rounded mb-4" />
              <div className="h-8 w-16 bg-muted-foreground/20 rounded" />
            </CardContent>
          </Card>
        ))}
        
        <div className="md:col-span-2">
          <Card className="h-full border-none bg-muted/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-5 w-36 bg-muted-foreground/20 rounded mb-4" />
              <div className="h-10 w-32 bg-muted-foreground/20 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
