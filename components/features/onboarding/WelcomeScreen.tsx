import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SignIn from "@/components/features/onboarding/SignIn"
import { GoogleSignIn } from "@/components/auth/google-signin";

interface WelcomeScreenProps {
    onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
            >
                <div className="flex justify-center mb-4">
                    <img src="/logo.png" alt="Verifeye Logo" className="w-50 h-50 object-contain" />
                </div>
                {/*<h1 className="text-4xl font-bold tracking-tight text-primary">Verifeye</h1>*/}
                <p className="text-lg text-muted-foreground">
                    Connect with your verified neighbors. Build a safer community together.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full max-w-sm space-y-4"
            >
                <div className="space-y-2">
                    <Button onClick={onNext} className="w-full h-12 text-lg font-medium">
                        Sign Up with Email
                    </Button>
                    
                    <GoogleSignIn/>
                    
                    <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                        Already have an account? Log in
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
