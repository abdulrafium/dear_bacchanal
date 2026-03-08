"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Failed to initiate payment");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[45vh]  rounded-[3vh] overflow-hidden p-0">
                <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-[4vh] sm:p-[5vh]">
                    <DialogHeader className="mb-[2.4vh]">
                        <div className="w-[8vh] h-[8vh] bg-primary/20 rounded-[2vh] flex items-center justify-center mb-[2.4vh] mx-auto animate-bounce">
                            <CreditCard className="w-[4vh] h-[4vh] text-primary" />
                        </div>
                        <DialogTitle className="text-[3.5vh] font-display text-center text-foreground mb-[1.5vh]">
                            Unlock Your Carnival Book
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground text-[2vh] font-body leading-relaxed">
                            Finalize and save your memories with our premium book builder for a one-time fee of <span className="font-bold text-primary">$20</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-[1.5vh] mb-[3.2vh]">
                        <div className="flex items-start gap-[1.2vh] p-[1.6vh] bg-white/50 backdrop-blur-sm rounded-[1.6vh] border-[0.1vh] border-white/20">
                            <Sparkles className="w-[2.5vh] h-[2.5vh] text-accent mt-[0.2vh]" />
                            <p className="text-[1.6vh] font-body text-foreground/80">
                                Unlimited text editing and photo curation
                            </p>
                        </div>
                        <div className="flex items-start gap-[1.2vh] p-[1.6vh] bg-white/50 backdrop-blur-sm rounded-[1.6vh] border-[0.1vh] border-white/20">
                            <Sparkles className="w-[2.5vh] h-[2.5vh] text-accent mt-[0.2vh]" />
                            <p className="text-[1.6vh] font-body text-foreground/80">
                                Unlock all premium templates and layouts
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-[1.2vh]">
                        <Button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full h-[6vh] text-[2vh] font-bold rounded-[1.6vh] bg-primary hover:bg-primary/90 text-white shadow-xl transition-all active:scale-[0.98] group"
                        >
                            {loading ? (
                                <div className="flex items-center gap-[1vh]">
                                    <div className="w-[2.5vh] h-[2.5vh] border-[0.3vh] border-white/30 border-t-white rounded-full animate-spin" />
                                    Preparing Checkout...
                                </div>
                            ) : (
                                <div className="flex items-center gap-[1vh] justify-center">
                                    Pay $20 & Save Book
                                    <Sparkles className="w-[2.5vh] h-[2.5vh] group-hover:rotate-12 transition-transform" />
                                </div>
                            )}
                        </Button>

                        <p className="text-[1.2vh] text-center text-muted-foreground font-body">
                            Secure payment via Stripe. One-time fee, no subscriptions.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
