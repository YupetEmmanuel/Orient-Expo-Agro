import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, insertAnswerSchema, type Question, type Answer, type InsertQuestion, type InsertAnswer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, MessageCircle, Send, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

export default function QuestionsPage() {
  const { toast } = useToast();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const questionForm = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      title: "",
      body: "",
      authorName: "",
    },
  });

  const answerForm = useForm<InsertAnswer>({
    resolver: zodResolver(insertAnswerSchema),
    defaultValues: {
      questionId: "",
      body: "",
      authorName: "",
    },
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/questions?search=${encodeURIComponent(searchQuery)}`
        : "/api/questions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const { data: answers = [] } = useQuery<Answer[]>({
    queryKey: ["/api/questions", selectedQuestion?.id, "answers"],
    queryFn: async () => {
      if (!selectedQuestion) return [];
      const res = await fetch(`/api/questions/${selectedQuestion.id}/answers`);
      if (!res.ok) throw new Error("Failed to fetch answers");
      return res.json();
    },
    enabled: !!selectedQuestion,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const res = await apiRequest("POST", "/api/questions", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to create question");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success!",
        description: "Your question has been posted.",
      });
      questionForm.reset();
      setIsQuestionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: async (data: InsertAnswer) => {
      const res = await apiRequest("POST", "/api/answers", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to create answer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions", selectedQuestion?.id, "answers"] });
      toast({
        title: "Success!",
        description: "Your answer has been posted.",
      });
      answerForm.reset();
      answerForm.setValue("questionId", selectedQuestion?.id || "");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onQuestionSubmit = async (data: InsertQuestion) => {
    createQuestionMutation.mutate(data);
  };

  const onAnswerSubmit = async (data: InsertAnswer) => {
    if (!selectedQuestion) return;
    createAnswerMutation.mutate({
      ...data,
      questionId: selectedQuestion.id,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/80"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Learn About Orient</h1>
            <p className="text-primary-foreground/80">Post questions and get answers from the community</p>
          </div>
          <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="hidden sm:flex"
                data-testid="button-ask-question"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Ask Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ask a Question</DialogTitle>
                <DialogDescription>
                  Share your question with the community and get helpful answers.
                </DialogDescription>
              </DialogHeader>
              <Form {...questionForm}>
                <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                  <FormField
                    control={questionForm.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-question-author" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={questionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Title</FormLabel>
                        <FormControl>
                          <Input placeholder="What is..." {...field} data-testid="input-question-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={questionForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide more details about your question..."
                            {...field}
                            data-testid="textarea-question-body"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createQuestionMutation.isPending}
                    data-testid="button-submit-question"
                  >
                    {createQuestionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Question
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:hidden"
              data-testid="button-ask-question-mobile"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Ask Question
            </Button>
          </DialogTrigger>
        </Dialog>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions... (e.g., vendor, contact, upload)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-questions"
          />
        </div>

        {questionsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card
                key={question.id}
                className="card-hover cursor-pointer"
                onClick={() => setSelectedQuestion(question)}
                data-testid={`card-question-${question.id}`}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{question.title}</CardTitle>
                  <CardDescription>
                    Asked by {question.authorName} •{" "}
                    {formatDistanceToNow(new Date(question.createdAt!), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{question.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedQuestion && (
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedQuestion.title}</DialogTitle>
              <DialogDescription>
                Asked by {selectedQuestion.authorName} •{" "}
                {formatDistanceToNow(new Date(selectedQuestion.createdAt!), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <p className="text-foreground">{selectedQuestion.body}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Answers ({answers.length})
                </h3>

                {answers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No answers yet. Be the first to answer!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {answers.map((answer) => (
                      <Card key={answer.id} data-testid={`card-answer-${answer.id}`}>
                        <CardHeader>
                          <CardDescription>
                            {answer.authorName} •{" "}
                            {formatDistanceToNow(new Date(answer.createdAt!), { addSuffix: true })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>{answer.body}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Form {...answerForm}>
                <form onSubmit={answerForm.handleSubmit(onAnswerSubmit)} className="space-y-4">
                  <FormField
                    control={answerForm.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-answer-author" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={answerForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Answer</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your answer..."
                            {...field}
                            data-testid="textarea-answer-body"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createAnswerMutation.isPending}
                    data-testid="button-submit-answer"
                  >
                    {createAnswerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Answer
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
