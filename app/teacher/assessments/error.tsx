'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';

/** Render-time crash boundary for the whole assessments segment. */
export default function AssessmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Assessment workspace error:', error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6">
      <Card className="max-w-xl mx-auto">
        <EmptyState
          icon={<AlertOctagon className="w-6 h-6" />}
          title="This page ran into a problem"
          description="Nothing on the server was affected — your assessment and any work the AI has completed are safe."
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
              <Link href="/teacher/assessments">
                <Button variant="ghost" className="text-gray-300 w-full sm:w-auto">
                  Back to assessments
                </Button>
              </Link>
            </div>
          }
        />
      </Card>
    </div>
  );
}
