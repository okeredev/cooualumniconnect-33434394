import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Vote, AlertCircle, Loader2 } from "lucide-react";

interface VotingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidateName: string;
  position: string;
  isVoting: boolean;
}

export const VotingDialog = ({ isOpen, onClose, onConfirm, candidateName, position, isVoting }: VotingDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-card/60 backdrop-blur-xl shadow-2xl rounded-[2rem]">
        <div className="relative p-8 pt-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-gold to-primary" />
          
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold text-center text-primary">Confirm Your Vote</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-base leading-relaxed">
              You are about to cast your official vote for:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 p-6 rounded-3xl bg-muted/50 border border-border/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 text-center">
              <h4 className="font-display font-bold text-xl text-primary">{candidateName}</h4>
              <p className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mt-1">{position}</p>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
              This action is <span className="font-bold underline">final</span>. Once cast, your vote is encrypted and cannot be retracted or altered.
            </p>
          </div>

          <DialogFooter className="mt-10 sm:justify-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isVoting} className="rounded-2xl h-14 px-8 font-semibold hover:bg-muted/80">
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={isVoting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all min-w-[160px]"
            >
              {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Vote className="w-5 h-5 mr-2" />}
              {isVoting ? "Casting..." : "Cast My Vote"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
