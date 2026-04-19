// Placeholder — real daily report lands in Cycles 6-9.
export default function TodayStub({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6 space-y-2">
      <h1 className="text-2xl font-bold">היום</h1>
      <p className="text-muted-foreground">דיווח יומי לפרויקט {params.id}.</p>
      <p className="text-sm text-muted-foreground">
        זה דף זמני. הטופס המלא (נוכחות, הערות, תמונות, בעיות) יגיע במחזורים הקרובים.
      </p>
    </div>
  );
}
