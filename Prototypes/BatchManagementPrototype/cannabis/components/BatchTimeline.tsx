import { TimelineEvent, EventType } from '../types/batch';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Bell, Settings, FileText, CheckCircle } from 'lucide-react';

interface BatchTimelineProps {
  events: TimelineEvent[];
}

const eventIcons: Record<EventType, React.ReactNode> = {
  stage_change: <CheckCircle className="w-5 h-5 text-green-600" />,
  alarm: <AlertTriangle className="w-5 h-5 text-red-600" />,
  override: <Settings className="w-5 h-5 text-orange-600" />,
  note: <FileText className="w-5 h-5 text-blue-600" />,
  qa_check: <Bell className="w-5 h-5 text-purple-600" />,
};

const eventColors: Record<EventType, string> = {
  stage_change: 'bg-green-100 text-green-800',
  alarm: 'bg-red-100 text-red-800',
  override: 'bg-orange-100 text-orange-800',
  note: 'bg-blue-100 text-blue-800',
  qa_check: 'bg-purple-100 text-purple-800',
};

export function BatchTimeline({ events }: BatchTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className="p-6">
      <h3 className="text-gray-900 mb-6">Batch Timeline</h3>
      
      <div className="space-y-4">
        {sortedEvents.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="bg-white border-2 border-gray-200 rounded-full p-2">
                {eventIcons[event.type]}
              </div>
              {index < sortedEvents.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 my-1" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge className={eventColors[event.type]}>
                    {event.type.replace('_', ' ')}
                  </Badge>
                  <p className="text-gray-900 mt-1">{event.description}</p>
                </div>
                <p className="text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Event data */}
              {event.data && (
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <pre className="text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Evidence images */}
              {event.evidenceUrls && event.evidenceUrls.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {event.evidenceUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Evidence"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* User info */}
              {event.userId && (
                <p className="text-gray-500 mt-2">By: User {event.userId}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
