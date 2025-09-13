import { Share } from 'lucide-react';
import { Button } from './ui/button';

export function AdvisoryHeader() {
  return (
    <div className="h-0 glass-subtle border-b border-slate-200/40 flex items-center justify-end px-4">
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white h-8 px-4 rounded-xl glass-subtle transition-all duration-200 shadow-lg px-[14px] py-[0px] m-[0px] text-[14px] text-[13px] text-[12px] text-[11px] text-[12px] text-[13px]"
      >
        <Share className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
}