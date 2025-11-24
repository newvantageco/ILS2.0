import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Copy, Github } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function GitHubPushPage() {
  const { toast } = useToast();
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("Replit project");
  const [createdRepo, setCreatedRepo] = useState<any>(null);

  const { data: githubUser, isLoading: loadingUser } = useQuery({
    queryKey: ['/api/github/user'],
  });

  const createRepoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: repoName, isPrivate, description })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create repository');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      setCreatedRepo(data);
      toast({
        title: "Repository created!",
        description: `Successfully created ${data.full_name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create repository",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
    });
  };

  const handleCreateRepo = () => {
    if (!repoName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a repository name",
        variant: "destructive",
      });
      return;
    }
    createRepoMutation.mutate();
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Github className="h-8 w-8" />
          Push to GitHub
        </h1>
        <p className="text-muted-foreground">
          Create a new GitHub repository and push your code
        </p>
      </div>

      {githubUser ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected GitHub Account</CardTitle>
            <CardDescription>
              Logged in as <strong>{(githubUser as any).login}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!createdRepo ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Repository</CardTitle>
            <CardDescription>
              Create a new GitHub repository for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository Name</Label>
              <Input
                id="repo-name"
                data-testid="input-repo-name"
                placeholder="my-awesome-project"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                data-testid="input-description"
                placeholder="A brief description of your project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="private"
                data-testid="checkbox-private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
              />
              <Label htmlFor="private" className="cursor-pointer">
                Make this repository private
              </Label>
            </div>

            <Button
              data-testid="button-create-repo"
              onClick={handleCreateRepo}
              disabled={createRepoMutation.isPending}
              className="w-full"
            >
              {createRepoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Repository...
                </>
              ) : (
                "Create Repository"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Repository Created Successfully!</CardTitle>
            </div>
            <CardDescription>
              Repository URL: <a href={createdRepo.html_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{createdRepo.html_url}</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Next Steps: Push Your Code</h3>
              <p className="text-sm text-muted-foreground">
                Run these commands in the Replit Shell to push your code to GitHub:
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">1. Initialize git repository (if not already done)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono">
                      git init
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard("git init")}
                      data-testid="button-copy-init"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">2. Add all files to git</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono">
                      git add .
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard("git add .")}
                      data-testid="button-copy-add"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">3. Commit your changes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono">
                      git commit -m &ldquo;Initial commit&rdquo;
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard('git commit -m "Initial commit"')}
                      data-testid="button-copy-commit"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">4. Set the main branch</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono">
                      git branch -M main
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard("git branch -M main")}
                      data-testid="button-copy-branch"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">5. Add the remote repository</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono break-all">
                      git remote add origin {createdRepo.clone_url}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(`git remote add origin ${createdRepo.clone_url}`)}
                      data-testid="button-copy-remote"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">6. Push to GitHub</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-muted rounded text-sm font-mono">
                      git push -u origin main
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard("git push -u origin main")}
                      data-testid="button-copy-push"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm">
                  <strong>Note:</strong> You can run these commands in the Replit Shell. Open the Shell tab and paste each command one at a time.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="button-view-repo"
                onClick={() => window.open(createdRepo.html_url, '_blank')}
                variant="default"
              >
                View Repository on GitHub
              </Button>
              <Button
                data-testid="button-create-another"
                onClick={() => {
                  setCreatedRepo(null);
                  setRepoName("");
                  setDescription("Replit project");
                  setIsPrivate(false);
                }}
                variant="outline"
              >
                Create Another Repository
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
