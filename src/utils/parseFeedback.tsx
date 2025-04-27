export interface FeedbackEvent {
  timestamp: string;
  event: string;
  evaluation?: string;
  rationale?: string;
  recommendation?: string;
}

export interface FeedbackSummary {
  events: FeedbackEvent[];
  debriefNotes?: string[];
  overallEvaluation?: string;
}

export const parseFeedback = (feedbackText: string): FeedbackSummary => {
  if (!feedbackText) return { events: [] };

  const lines = feedbackText.split('\n');
  const events: FeedbackEvent[] = [];
  const debriefNotes: string[] = [];
  let currentEvent: Partial<FeedbackEvent> = {};
  let isInDebriefSection = false;
  let overallEvaluation = '';

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('TIME:')) {
      // If we were working on a previous event, save it
      if (currentEvent.timestamp) {
        events.push(currentEvent as FeedbackEvent);
      }
      
      // Start a new event
      currentEvent = {
        timestamp: trimmedLine.split('TIME:')[1].trim(),
        event: ''
      };
    } else if (trimmedLine.startsWith('EVENT:')) {
      if (currentEvent.timestamp) {
        currentEvent.event = trimmedLine.split('EVENT:')[1].trim();
      }
    } else if (trimmedLine.startsWith('EVALUATION:')) {
      if (currentEvent.timestamp) {
        currentEvent.evaluation = trimmedLine.split('EVALUATION:')[1].trim();
      }
    } else if (trimmedLine.startsWith('RATIONALE:')) {
      if (currentEvent.timestamp) {
        currentEvent.rationale = trimmedLine.split('RATIONALE:')[1].trim();
      }
    } else if (trimmedLine.startsWith('RECOMMENDATION:')) {
      if (currentEvent.timestamp) {
        currentEvent.recommendation = trimmedLine.split('RECOMMENDATION:')[1].trim();
      }
    } else if (trimmedLine.startsWith('DEBRIEF NOTES:')) {
      // Save the last event if we were working on one
      if (currentEvent.timestamp) {
        events.push(currentEvent as FeedbackEvent);
        currentEvent = {};
      }
      isInDebriefSection = true;
    } else if (trimmedLine.startsWith('OVERALL EVALUATION:')) {
      isInDebriefSection = false;
      overallEvaluation = trimmedLine.split('OVERALL EVALUATION:')[1].trim();
    } else if (trimmedLine && isInDebriefSection) {
      debriefNotes.push(trimmedLine);
    }
  });

  // Add the last event if we were working on one
  if (currentEvent.timestamp) {
    events.push(currentEvent as FeedbackEvent);
  }

  return {
    events,
    debriefNotes: debriefNotes.length > 0 ? debriefNotes : undefined,
    overallEvaluation: overallEvaluation || undefined
  };
}; 