// src/components/features/AiComplianceCheck.tsx
"use client";

import * as React from "react";
import { CheckCircle, XCircle, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Added missing import

interface AiComplianceCheckProps {
  formData?: any; // Conceptually, this would take the form data
}

interface CheckListItem {
  id: string;
  text: string;
  isCompliant: boolean | null; // null for not checked, true for compliant, false for not
  details?: string;
}

const initialChecklist: CheckListItem[] = [
  { id: "doc_completeness", text: "All required documents attached", isCompliant: null },
  { id: "value_threshold", text: "Value threshold for vehicle number met (if applicable)", isCompliant: null },
  { id: "info_accuracy", text: "Information accuracy against historical data", isCompliant: null },
  { id: "policy_alignment", text: "Alignment with internal policies", isCompliant: null },
];

export function AiComplianceCheck({ formData }: AiComplianceCheckProps) {
  const [checklist, setChecklist] = React.useState<CheckListItem[]>(initialChecklist);
  const [isLoading, setIsLoading] = React.useState(false);
  const [aiFeedback, setAiFeedback] = React.useState<{ likelihood: string; issues: string[] } | null>(null);
  const [progress, setProgress] = React.useState(0);

  const runAiCheck = async () => {
    setIsLoading(true);
    setAiFeedback(null);
    setProgress(0);

    // Simulate AI processing and checklist update
    // In a real app, you'd call your GenAI flow from src/ai/flows here
    // For example: const result = await someAiFlow(formData);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 200);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    clearInterval(interval);
    setProgress(100);

    // Mocked AI results
    const updatedChecklist = checklist.map(item => {
      const isCompliant = Math.random() > 0.3; // Random compliance
      return {
        ...item,
        isCompliant,
        details: isCompliant ? "Looks good." : "Attention needed. Please review."
      };
    });
    setChecklist(updatedChecklist);

    const compliantCount = updatedChecklist.filter(item => item.isCompliant).length;
    let likelihood = "Low";
    if (compliantCount === updatedChecklist.length) likelihood = "High";
    else if (compliantCount >= updatedChecklist.length / 2) likelihood = "Medium";

    setAiFeedback({
      likelihood,
      issues: updatedChecklist.filter(item => !item.isCompliant).map(item => `Issue with: ${item.text}`),
    });

    setIsLoading(false);
  };

  const getComplianceIcon = (isCompliant: boolean | null) => {
    if (isCompliant === null) return <AlertTriangle className="w-5 h-5 text-accent" />; // Changed text-yellow-500 to text-accent
    if (isCompliant) return <CheckCircle className="w-5 h-5 text-primary" />; // Changed text-green-500 to text-primary
    return <XCircle className="w-5 h-5 text-destructive" />; // Changed text-red-500 to text-destructive
  };

  return (
    <Card className="mt-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <Sparkles className="w-6 h-6 mr-2 text-primary" />
          AI Compliance Check
        </CardTitle>
        <CardDescription>
          Run a pre-submission check to ensure compliance and improve approval likelihood.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={runAiCheck} disabled={isLoading} className="w-full mb-4">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking Compliance...
            </>
          ) : (
            "Run AI Check"
          )}
        </Button>

        {isLoading && <Progress value={progress} className="w-full h-2 mb-4" />}

        <div className="space-y-3">
          {checklist.map(item => (
            <div key={item.id} className="flex items-start p-3 rounded-md bg-background">
              <div className="mr-3 shrink-0">{getComplianceIcon(item.isCompliant)}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                {item.details && <p className="text-xs text-muted-foreground">{item.details}</p>}
              </div>
            </div>
          ))}
        </div>

        {aiFeedback && (
          <div className="mt-6">
            <Separator className="my-4" />
            <h4 className="mb-2 text-lg font-semibold text-foreground">AI Assessment:</h4>
            <p className="text-sm text-foreground">
              Likelihood of Approval:{" "}
              <span
                className={cn(
                  "font-bold",
                  aiFeedback.likelihood === "High" && "text-primary", // Changed text-green-600
                  aiFeedback.likelihood === "Medium" && "text-accent", // Changed text-yellow-600
                  aiFeedback.likelihood === "Low" && "text-destructive" // Changed text-red-600
                )}
              >
                {aiFeedback.likelihood}
              </span>
            </p>
            {aiFeedback.issues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-destructive">Potential Issues:</p>
                <ul className="ml-5 text-sm list-disc text-destructive">
                  {aiFeedback.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
