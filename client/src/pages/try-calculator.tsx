import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePendingCalculator } from '@/hooks/use-pending-calculator';
import { AIFormulaResponse } from '@/lib/calculator-storage';
import GuestCalculatorPreview from '@/components/guest-calculator-preview';
import { Sparkles, ArrowRight, Calculator, Loader2, RotateCcw, Zap, Clock, Target } from 'lucide-react';
import autobidderLogo from '@assets/Autobidder Logo (1)_1753224528350.png';

const examplePrompts = [
  { label: 'Pressure Washing', description: 'pressure washing calculator for driveways, decks, and house exteriors' },
  { label: 'Lawn Care', description: 'lawn mowing and maintenance calculator based on yard size' },
  { label: 'House Cleaning', description: 'house cleaning service calculator based on rooms and square footage' },
  { label: 'Window Cleaning', description: 'window cleaning service calculator for residential homes' },
];

export default function TryCalculator() {
  const [description, setDescription] = useState('');
  const [generatedFormula, setGeneratedFormula] = useState<AIFormulaResponse | null>(null);
  const { toast } = useToast();
  const { save } = usePendingCalculator();

  const generateMutation = useMutation({
    mutationFn: async (desc: string) => {
      const response = await fetch('/api/formulas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate calculator');
      }
      return response.json() as Promise<AIFormulaResponse>;
    },
    onSuccess: (data) => {
      setGeneratedFormula(data);
      save(data);
      toast({
        title: 'Calculator Generated!',
        description: 'Your pricing calculator has been created. Try it out below!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe the service you want to create a calculator for.',
        variant: 'destructive',
      });
      return;
    }
    generateMutation.mutate(description);
  };

  const handleExampleClick = (example: (typeof examplePrompts)[0]) => {
    setDescription(`Create a ${example.description}`);
  };

  const handleReset = () => {
    setGeneratedFormula(null);
    setDescription('');
  };

  const handleSaveClick = () => {
    // Calculator is already saved to localStorage by the mutation
    // Navigate to signup with query param
    window.location.href = '/signup?from=try';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={autobidderLogo} alt="Autobidder" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {!generatedFormula ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Build Your Pricing Calculator
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  in 30 Seconds
                </span>
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Describe your service, and AI will create a professional pricing calculator instantly. No account needed
                to try.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Zap, title: 'Instant Generation', desc: 'AI creates your calculator in seconds' },
                { icon: Target, title: 'Smart Pricing', desc: 'Realistic contractor-based pricing' },
                { icon: Clock, title: 'No Account Needed', desc: 'Try it now, save it later' },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-sm text-white/60">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Generator Card */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Describe Your Service</h2>
                    <p className="text-sm text-white/60">Tell AI what kind of calculator you need</p>
                  </div>
                </div>

                {/* Example Prompts */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-sm rounded-full transition-colors"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Create a bathroom renovation calculator with options for tile work, fixtures, and labor..."
                  className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40 mb-4 resize-none"
                />

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !description.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Calculator...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Calculator
                    </>
                  )}
                </Button>

                {generateMutation.isPending && (
                  <p className="text-center text-white/60 text-sm mt-4">
                    AI is analyzing your requirements and creating a professional pricing calculator...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trust Indicator */}
            <p className="text-center text-white/50 text-sm mt-8">
              Powered by AI. Your calculator will be saved automatically and can be imported to your account.
            </p>
          </>
        ) : (
          <>
            {/* Generated Calculator View */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Calculator className="w-8 h-8" />
                    {generatedFormula.title || generatedFormula.name}
                  </h1>
                  <p className="text-white/60 mt-1">Test your calculator below. Create an account to save and customize it.</p>
                </div>
                <Button onClick={handleReset} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate Another
                </Button>
              </div>
            </div>

            {/* Calculator Preview */}
            <GuestCalculatorPreview formula={generatedFormula} onSaveClick={handleSaveClick} />

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border-purple-500/20 max-w-2xl mx-auto">
                <CardContent className="py-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to use this calculator?</h2>
                  <p className="text-white/70 mb-6">
                    Create a free account to save this calculator, customize the design, and embed it on your website.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup?from=try">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8">
                        Create Free Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login?from=try">
                      <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                        Already have an account? Sign In
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-white/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Autobidder. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/docs" className="hover:text-white/80">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-white/80">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white/80">
              Privacy
            </Link>
            <Link href="/pricing" className="hover:text-white/80">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
