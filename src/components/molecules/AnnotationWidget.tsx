import { useState } from 'react';
import { MessageCircle, Plus, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { AdvisoryCaption, AdvisoryBody } from '../atoms/Typography';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface AnnotationWidgetProps {
  comments?: Comment[];
  onAddComment?: (content: string) => void;
}

export function AnnotationWidget({ comments = [], onAddComment }: AnnotationWidgetProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <AdvisoryCaption>
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </AdvisoryCaption>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingComment(!isAddingComment)}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Note
        </Button>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-1 p-3 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <AdvisoryCaption className="font-medium">{comment.author}</AdvisoryCaption>
                <AdvisoryCaption>•</AdvisoryCaption>
                <AdvisoryCaption>{comment.timestamp}</AdvisoryCaption>
              </div>
              <AdvisoryBody className="text-[14px]">{comment.content}</AdvisoryBody>
            </div>
          ))}
        </div>
      )}

      {isAddingComment && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add your annotation..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] text-[14px]"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingComment(false);
                setNewComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}